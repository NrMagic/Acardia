import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, AppState, Image, Pressable, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions,
  View, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

const API = 'https://archive.org';
const SAVE_KEY = '@blastback/saves';
const LAST_KEY = '@blastback/last-session';
const SYSTEMS = [
  { id: 'internetarcade', label: 'Arcade', emoji: '🕹️' },
  { id: 'consolelivingroom', label: 'Consoles', emoji: '📺' },
  { id: 'softwarelibrary_msdos_games', label: 'MS-DOS', emoji: '💾' },
  { id: 'softwarelibrary_c64_games', label: 'Commodore 64', emoji: '🖥️' },
  { id: 'softwarelibrary_zx_spectrum', label: 'ZX Spectrum', emoji: '🌈' },
  { id: 'softwarelibrary_apple', label: 'Apple II', emoji: '🍏' },
];
const SORTS = [{label:'Mais jogados',value:'downloads desc'},{label:'Nome (A-Z)',value:'titleSorter asc'},{label:'Mais recentes',value:'year desc'}];
const thumb = id => `${API}/services/img/${encodeURIComponent(id)}`;
const embed = id => `${API}/embed/${encodeURIComponent(id)}`;
const clean = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function searchGames({collection, query, sort='downloads desc', rows=36}={}) {
  const collections = collection ? `collection:${collection}` : `(${SYSTEMS.map(s=>`collection:${s.id}`).join(' OR ')})`;
  const terms = [collections, 'mediatype:software'];
  if (query?.trim()) terms.push(`title:(${query.trim().replace(/[():"]/g,' ')})`);
  const params = new URLSearchParams({q:terms.join(' AND '),rows:String(rows),page:'1',output:'json'});
  ['identifier','title','year','downloads','creator'].forEach(f=>params.append('fl[]',f));
  params.append('sort[]',sort);
  const response = await fetch(`${API}/advancedsearch.php?${params.toString()}`);
  if (!response.ok) throw new Error(`Internet Archive respondeu ${response.status}`);
  const data = await response.json();
  return (data.response?.docs || []).map(g=>({...g,title:Array.isArray(g.title)?g.title[0]:g.title,creator:Array.isArray(g.creator)?g.creator[0]:g.creator}));
}
async function getItem(id) {
  const response = await fetch(`${API}/metadata/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`Não foi possível carregar o jogo (${response.status})`);
  const data = await response.json();
  const m = data.metadata || {};
  const first = v => Array.isArray(v)?v[0]:v;
  const list = v => v == null ? [] : Array.isArray(v)?v:[v];
  return {identifier:id,title:first(m.title)||id,description:clean(first(m.description)),year:first(m.year)||first(m.date),creator:first(m.creator),subject:list(m.subject).flatMap(s=>String(s).split(';')).map(s=>s.trim()).filter(Boolean).slice(0,8),collection:list(m.collection)};
}

export default function App() {
  const {width,height} = useWindowDimensions();
  const wide = width >= 700;
  const [screen,setScreen] = useState('home');
  const [games,setGames] = useState([]);
  const [systems,setSystems] = useState(SYSTEMS);
  const [selectedSystem,setSelectedSystem] = useState(null);
  const [selectedGame,setSelectedGame] = useState(null);
  const [detail,setDetail] = useState(null);
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState(SORTS[0].value);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [saves,setSaves] = useState([]);
  const [lastSession,setLastSession] = useState(null);
  const [showResume,setShowResume] = useState(false);
  const webRef = useRef(null);
  const startedAt = useRef(Date.now());

  const loadSaves = useCallback(async()=>{
    try {
      const [raw,last] = await Promise.all([AsyncStorage.getItem(SAVE_KEY),AsyncStorage.getItem(LAST_KEY)]);
      const parsed = raw ? JSON.parse(raw) : [];
      setSaves(Array.isArray(parsed)?parsed:[]);
      setLastSession(last?JSON.parse(last):null);
      setShowResume(Boolean(last));
    } catch { setSaves([]); setLastSession(null); }
  },[]);
  useEffect(()=>{loadSaves();},[loadSaves]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',async state=>{
      if ((state==='background'||state==='inactive') && selectedGame?.identifier) {
        const session={identifier:selectedGame.identifier,title:selectedGame.title||selectedGame.identifier,savedAt:new Date().toISOString(),elapsedSeconds:Math.max(0,Math.floor((Date.now()-startedAt.current)/1000))};
        try { await AsyncStorage.setItem(LAST_KEY,JSON.stringify(session)); setLastSession(session); } catch {}
      }
    });
    return ()=>subscription.remove();
  },[selectedGame]);

  const loadGames = useCallback(async(opts={})=>{
    setLoading(true); setError('');
    try { setGames(await searchGames(opts)); }
    catch(e){setError(e.message||'Erro ao buscar jogos.');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{loadGames({rows:24});},[loadGames]);

  const openGame = async game => {
    setSelectedGame(game); setScreen('detail'); setDetail(null); setError('');
    try { setDetail(await getItem(game.identifier)); }
    catch(e){setError(e.message);}
  };
  const play = async game => {
    const full = game || selectedGame;
    if (!full?.identifier) return;
    setSelectedGame(full); setScreen('player'); startedAt.current=Date.now();
    const session={identifier:full.identifier,title:full.title||full.identifier,savedAt:new Date().toISOString()};
    try { await AsyncStorage.setItem(LAST_KEY,JSON.stringify(session)); setLastSession(session); }
    catch { /* O jogo continua mesmo se o armazenamento estiver indisponível. */ }
  };
  const saveGame = async () => {
    if (!selectedGame?.identifier) return;
    const entry={identifier:selectedGame.identifier,title:selectedGame.title||selectedGame.identifier,savedAt:new Date().toISOString(),elapsedSeconds:Math.max(0,Math.floor((Date.now()-startedAt.current)/1000))};
    try {
      const next=[entry,...saves.filter(s=>s.identifier!==entry.identifier)].slice(0,30);
      await AsyncStorage.multiSet([[SAVE_KEY,JSON.stringify(next)],[LAST_KEY,JSON.stringify(entry)]]);
      setSaves(next); setLastSession(entry);
      Alert.alert('Sessão salva','O jogo foi adicionado aos seus salvos. Você poderá reabri-lo na próxima sessão.');
    } catch { Alert.alert('Não foi possível salvar','Verifique o espaço disponível no dispositivo.'); }
  };
  const resumeLast = async () => {
    if (!lastSession) return;
    await play({identifier:lastSession.identifier,title:lastSession.title});
    setShowResume(false);
  };
  const removeSave = async id => {
    const next=saves.filter(s=>s.identifier!==id);
    setSaves(next);
    await AsyncStorage.setItem(SAVE_KEY,JSON.stringify(next));
  };

  const sendKey = (key,down) => {
    const codeMap={ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,z:90,x:88,Enter:13,Shift:16,'5':53,'1':49};
    const code=codeMap[key]||key.charCodeAt(0);
    const script=`(function(){try{var t=document;var e=new KeyboardEvent('${down?'keydown':'keyup'}',{key:${JSON.stringify(key)},code:${JSON.stringify(key==='Enter'?'Enter':key==='Shift'?'ShiftLeft':key.length===1?'Key'+key.toUpperCase():key)},keyCode:${code},which:${code},bubbles:true,cancelable:true});t.dispatchEvent(e);window.dispatchEvent(e);var f=document.querySelector('iframe');if(f){try{f.contentWindow.dispatchEvent(new KeyboardEvent('${down?'keydown':'keyup'}',{key:${JSON.stringify(key)},keyCode:${code},which:${code},bubbles:true}));}catch(_){}}}catch(e){} })();true;`;
    webRef.current?.injectJavaScript(script);
  };

  const renderGame = ({item}) => (
    <Pressable onPress={()=>openGame(item)} style={[styles.gameCard,{width:'100%'}]}>
      <Image source={{uri:thumb(item.identifier)}} style={styles.gameImage} resizeMode="cover"/>
      <Text numberOfLines={2} style={styles.gameTitle}>{item.title||item.identifier}</Text>
      <Text style={styles.muted}>{item.year||'Clássico arcade'}</Text>
    </Pressable>
  );
  const header = <View style={styles.header}>
    <Pressable onPress={()=>setScreen('home')}><Text style={styles.brand}>▣ BLAST BACK</Text></Pressable>
    <View style={styles.nav}>
      {[['home','Início'],['systems','Sistemas'],['search','Buscar'],['saves','Salvos']].map(([id,label])=><Pressable key={id} onPress={()=>{setScreen(id);if(id==='systems')setGames([]);}} style={styles.navItem}><Text style={screen===id?styles.navActive:styles.navText}>{label}</Text></Pressable>)}
    </View>
  </View>;
  const listHeader = (title,subtitle) => <View style={styles.sectionHead}><Text style={styles.heading}>{title}</Text>{subtitle?<Text style={styles.muted}>{subtitle}</Text>:null}</View>;

  if (screen==='player' && selectedGame) return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content"/>
    <View style={styles.playerTop}>
      <Pressable onPress={()=>setScreen('detail')}><Text style={styles.navActive}>‹ Voltar</Text></Pressable>
      <Text numberOfLines={1} style={styles.playerTitle}>{selectedGame.title||selectedGame.identifier}</Text>
      <Pressable onPress={saveGame} style={styles.saveButton}><Text style={styles.saveText}>Salvar</Text></Pressable>
    </View>
    <View style={styles.webWrap}><WebView ref={webRef} source={{uri:embed(selectedGame.identifier)}} javaScriptEnabled domStorageEnabled allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} originWhitelist={['*']} style={styles.webview} startInLoadingState renderLoading={()=> <ActivityIndicator color="#55f2d0" size="large"/>}/></View>
    <View style={styles.playerHint}><Text style={styles.muted}>Os controles abaixo enviam comandos de teclado ao emulador. O suporte varia conforme o jogo.</Text></View>
    {Platform.OS!=='web' && <View style={[styles.touchPanel,{paddingHorizontal:Math.max(14,width*0.055),paddingBottom:Math.max(12,height*0.018)}]}>
      <View style={styles.dpad}>
        <View style={styles.dpadRow}><TouchButton label="▲" keyName="ArrowUp" sendKey={sendKey} size={Math.min(58,width*0.14)}/></View>
        <View style={styles.dpadRow}><TouchButton label="◀" keyName="ArrowLeft" sendKey={sendKey} size={Math.min(58,width*0.14)}/><View style={{width:Math.min(58,width*0.14),height:Math.min(58,width*0.14)}}/><TouchButton label="▶" keyName="ArrowRight" sendKey={sendKey} size={Math.min(58,width*0.14)}/></View>
        <View style={styles.dpadRow}><TouchButton label="▼" keyName="ArrowDown" sendKey={sendKey} size={Math.min(58,width*0.14)}/></View>
      </View>
      <View style={styles.actionPad}>
        <View style={styles.actionRow}><TouchButton label="B" keyName="x" sendKey={sendKey} accent size={Math.min(58,width*0.14)}/><TouchButton label="A" keyName="z" sendKey={sendKey} accent size={Math.min(58,width*0.14)}/></View>
        <View style={styles.actionRow}><TouchButton label="SELECT" keyName="5" sendKey={sendKey} small/><TouchButton label="START" keyName="1" sendKey={sendKey} small/></View>
      </View>
    </View>}
  </SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content"/>
    {header}
    <ScrollView contentContainerStyle={[styles.content,{maxWidth:1100,width:'100%',alignSelf:'center',paddingHorizontal:wide?28:16}]}>
      {screen==='home' && <>
        <View style={styles.hero}>
          <Text style={styles.kicker}>INSERT COIN</Text><Text style={styles.heroTitle}>BLAST BACK</Text>
          <Text style={styles.heroText}>Reviva os clássicos dos videogames em qualquer lugar.</Text>
          <View style={styles.heroActions}><Pressable style={styles.primaryButton} onPress={()=>setScreen('systems')}><Text style={styles.primaryText}>VER SISTEMAS</Text></Pressable><Pressable style={styles.outlineButton} onPress={()=>setScreen('search')}><Text style={styles.outlineText}>BUSCAR JOGOS</Text></Pressable></View>
        </View>
        {showResume && lastSession && <View style={styles.resumeCard}><View style={{flex:1}}><Text style={styles.resumeTitle}>CONTINUAR JOGANDO?</Text><Text style={styles.muted}>{lastSession.title}</Text></View><Pressable style={styles.primaryButton} onPress={resumeLast}><Text style={styles.primaryText}>CONTINUAR</Text></Pressable></View>}
        {listHeader('Jogos populares','Clássicos disponíveis no Internet Archive')}
        {loading?<ActivityIndicator color="#55f2d0" size="large"/>:error?<Text style={styles.error}>{error}</Text>:<View style={styles.gameGrid}>{games.map(g=><View key={g.identifier} style={{width:wide?'23.5%':'48%'}}>{renderGame({item:g})}</View>)}</View>}
        <Pressable style={styles.outlineButton} onPress={()=>loadGames({rows:48})}><Text style={styles.outlineText}>ATUALIZAR LISTA</Text></Pressable>
      </>}
      {screen==='systems' && <>
        {listHeader('Sistemas','Escolha uma plataforma para explorar os jogos')}
        <View style={styles.systemGrid}>{systems.map(s=><Pressable key={s.id} style={styles.systemCard} onPress={()=>{setSelectedSystem(s);setScreen('system-games');loadGames({collection:s.id,rows:48});}}><Text style={styles.systemEmoji}>{s.emoji}</Text><Text style={styles.systemTitle}>{s.label}</Text></Pressable>)}</View>
      </>}
      {screen==='system-games' && <>
        {listHeader(selectedSystem?.label||'Jogos','Selecione um jogo para ver os detalhes')}
        <Pressable onPress={()=>setScreen('systems')}><Text style={styles.navActive}>‹ Voltar aos sistemas</Text></Pressable>
        {loading?<ActivityIndicator color="#55f2d0"/>:error?<Text style={styles.error}>{error}</Text>:<View style={styles.gameGrid}>{games.map(g=><View key={g.identifier} style={{width:wide?'23.5%':'48%'}}>{renderGame({item:g})}</View>)}</View>}
      </>}
      {screen==='search' && <>
        {listHeader('Buscar jogos','Pesquise no catálogo do Internet Archive')}
        <TextInput value={query} onChangeText={setQuery} placeholder="Nome do jogo..." placeholderTextColor="#82909b" style={styles.input} returnKeyType="search" onSubmitEditing={()=>loadGames({query,rows:48})}/>
        <View style={styles.sortRow}>{SORTS.map(s=><Pressable key={s.value} onPress={()=>setSort(s.value)} style={[styles.sortChip,sort===s.value&&styles.sortSelected]}><Text style={styles.sortText}>{s.label}</Text></Pressable>)}</View>
        <Pressable style={styles.primaryButton} onPress={()=>loadGames({query,sort,rows:48})}><Text style={styles.primaryText}>PESQUISAR</Text></Pressable>
        {loading?<ActivityIndicator color="#55f2d0"/>:error?<Text style={styles.error}>{error}</Text>:<View style={styles.gameGrid}>{games.map(g=><View key={g.identifier} style={{width:wide?'23.5%':'48%'}}>{renderGame({item:g})}</View>)}</View>}
      </>}
      {screen==='saves' && <>
        {listHeader('Jogos salvos','Suas sessões ficam armazenadas neste dispositivo')}
        {saves.length===0?<Text style={styles.muted}>Você ainda não salvou nenhuma sessão.</Text>:saves.map(s=><View key={s.identifier} style={styles.savedRow}><View style={{flex:1}}><Text style={styles.gameTitle}>{s.title}</Text><Text style={styles.muted}>Salvo em {new Date(s.savedAt).toLocaleString('pt-BR')}</Text></View><Pressable style={styles.primaryButton} onPress={()=>play({identifier:s.identifier,title:s.title})}><Text style={styles.primaryText}>ABRIR</Text></Pressable><Pressable onPress={()=>removeSave(s.identifier)}><Text style={styles.deleteText}>×</Text></Pressable></View>)}
      </>}
      {screen==='detail' && selectedGame && <>
        <Pressable onPress={()=>setScreen('home')}><Text style={styles.navActive}>‹ Voltar</Text></Pressable>
        <Image source={{uri:thumb(selectedGame.identifier)}} style={styles.detailImage} resizeMode="contain"/>
        <Text style={styles.heading}>{detail?.title||selectedGame.title||selectedGame.identifier}</Text>
        <Text style={styles.muted}>{detail?.year||selectedGame.year||''} {detail?.creator?` • ${detail.creator}`:''}</Text>
        <Text style={styles.bodyText}>{detail?.description||error||'Carregando informações do jogo...'}</Text>
        <Pressable style={styles.primaryButton} onPress={()=>play(selectedGame)}><Text style={styles.primaryText}>▶ JOGAR AGORA</Text></Pressable>
      </>}
      <Text style={styles.footer}>BLAST BACK • Jogos fornecidos pelo Internet Archive</Text>
    </ScrollView>
  </SafeAreaView>;
}

function TouchButton({label,keyName,sendKey,size=54,accent=false,small=false}) {
  return <Pressable onPressIn={()=>sendKey(keyName,true)} onPressOut={()=>sendKey(keyName,false)} onTouchCancel={()=>sendKey(keyName,false)} style={({pressed})=>[styles.touchButton,{width:small?76:size,height:small?42:size,borderRadius:small?10:Math.max(12,size*0.25),backgroundColor:accent?'#a82f70':'#183b49',opacity:pressed?0.65:1}]}><Text style={[styles.touchLabel,{fontSize:small?10:22}]}>{label}</Text></Pressable>;
}

const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:'#080f18'},header:{paddingHorizontal:16,paddingTop:10,paddingBottom:12,borderBottomWidth:1,borderBottomColor:'#1d3945',backgroundColor:'#0b1722',flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8},
 brand:{color:'#55f2d0',fontSize:20,fontWeight:'900',letterSpacing:2},nav:{flexDirection:'row',flexWrap:'wrap',gap:12},navItem:{paddingVertical:8},navText:{color:'#a6b4bd',fontSize:12},navActive:{color:'#55f2d0',fontWeight:'800',fontSize:13},
 content:{paddingTop:20,paddingBottom:36,gap:18},hero:{padding:24,borderWidth:1,borderColor:'#257d79',borderRadius:14,backgroundColor:'#102a32',alignItems:'center',gap:12},kicker:{color:'#f3b94f',fontSize:11,fontWeight:'900',letterSpacing:3},heroTitle:{color:'#55f2d0',fontSize:36,fontWeight:'900',letterSpacing:3,textAlign:'center'},heroText:{color:'#c4d1d5',textAlign:'center',fontSize:14},heroActions:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10},
 primaryButton:{backgroundColor:'#55f2d0',paddingHorizontal:16,paddingVertical:12,borderRadius:8,alignItems:'center',justifyContent:'center'},primaryText:{color:'#07151a',fontSize:11,fontWeight:'900',letterSpacing:1},outlineButton:{borderWidth:1,borderColor:'#55f2d0',paddingHorizontal:16,paddingVertical:12,borderRadius:8,alignItems:'center'},outlineText:{color:'#55f2d0',fontSize:11,fontWeight:'900',letterSpacing:1},
 sectionHead:{gap:5,marginTop:8},heading:{color:'#55f2d0',fontSize:21,fontWeight:'900'},muted:{color:'#91a2ad',fontSize:12,lineHeight:18},gameGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:14},gameCard:{backgroundColor:'#111f2b',borderWidth:1,borderColor:'#1e3947',borderRadius:9,overflow:'hidden',paddingBottom:10},gameImage:{width:'100%',aspectRatio:4/3,backgroundColor:'#172a36'},gameTitle:{color:'#e7f0f2',fontWeight:'700',fontSize:13,paddingHorizontal:9,paddingTop:9},systemGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},systemCard:{width:'47%',minHeight:116,backgroundColor:'#111f2b',borderWidth:1,borderColor:'#1e3947',borderRadius:10,alignItems:'center',justifyContent:'center',gap:10,padding:14},systemEmoji:{fontSize:30},systemTitle:{color:'#55f2d0',fontWeight:'800',fontSize:12,textAlign:'center'},
 input:{backgroundColor:'#111f2b',borderWidth:1,borderColor:'#31505d',borderRadius:8,color:'#fff',padding:13},sortRow:{flexDirection:'row',flexWrap:'wrap',gap:8},sortChip:{borderWidth:1,borderColor:'#31505d',padding:8,borderRadius:20},sortSelected:{backgroundColor:'#173d40',borderColor:'#55f2d0'},sortText:{color:'#d8e3e6',fontSize:11},error:{color:'#ff8585'},resumeCard:{backgroundColor:'#142c32',padding:14,borderRadius:10,borderWidth:1,borderColor:'#55f2d0',flexDirection:'row',alignItems:'center',gap:10},resumeTitle:{color:'#55f2d0',fontWeight:'900',fontSize:12},savedRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#111f2b',padding:12,borderRadius:9},deleteText:{color:'#ff8585',fontSize:25,paddingHorizontal:8},detailImage:{width:'100%',height:190,backgroundColor:'#111f2b',borderRadius:10},bodyText:{color:'#d2dcdf',fontSize:14,lineHeight:22},footer:{color:'#52636d',fontSize:10,textAlign:'center',marginTop:24},
 playerTop:{paddingHorizontal:12,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},playerTitle:{color:'#e5f1f2',fontWeight:'800',flex:1,textAlign:'center'},saveButton:{backgroundColor:'#55f2d0',paddingHorizontal:14,paddingVertical:9,borderRadius:7},saveText:{color:'#07151a',fontWeight:'900',fontSize:12},webWrap:{flex:1,minHeight:180,marginHorizontal:6,borderWidth:1,borderColor:'#55f2d0',borderRadius:8,overflow:'hidden'},webview:{flex:1,backgroundColor:'#000'},playerHint:{paddingHorizontal:14,paddingVertical:7},touchPanel:{backgroundColor:'#0c1b27',borderTopWidth:1,borderColor:'#1e3947',paddingTop:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},dpad:{alignItems:'center',gap:4},dpadRow:{flexDirection:'row',alignItems:'center',gap:4},actionPad:{alignItems:'center',gap:14},actionRow:{flexDirection:'row',alignItems:'center',gap:12},touchButton:{alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#4b7782',elevation:3},touchLabel:{color:'#fff',fontWeight:'900'}
});
