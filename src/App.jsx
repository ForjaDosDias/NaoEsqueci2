import React, { useEffect, useState } from 'react';
import { useStore } from './store.js';
import { BottomNav, Sheet, Toast } from './components.jsx';
import AuthScreen from './screens/Auth.jsx';
import HomeScreen from './screens/Home.jsx';
import AddProductScreen, { ProductDetail } from './screens/Product.jsx';
import BuyScreen from './screens/Buy.jsx';
import ScanScreen from './screens/Scan.jsx';
import ArmarioScreen from './screens/Armario.jsx';
import StatusScreen from './screens/Status.jsx';
import ListaScreen from './screens/Lista.jsx';
import PerfilScreen from './screens/Perfil.jsx';

export default function App() {
  const [state, dispatch] = useStore();
  const [screen, setScreen] = useState('home'); // home | armario | lista | perfil | add | buy | scan | status
  const [detail, setDetail] = useState(null);   // produto aberto no sheet
  const [toast, setToast] = useState(null);
  const [prefillName, setPrefillName] = useState('');

  const showToast = msg => {
    setToast({ msg, t: Date.now() });
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // mantém status/auto-lista frescos ao voltar para o app
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && dispatch({ type: 'refresh' });
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!state.user) {
    return (
      <div className="app-shell">
        <AuthScreen onLogin={({ name, email, signup, demo }) => {
          dispatch({ type: 'login', name, email, demo });
          setScreen(demo ? 'home' : 'armario');
        }} />
      </div>
    );
  }

  const products = state.products;
  const listCount = products.filter(p => p.onList).length;
  const detailProduct = detail ? products.find(p => p.id === detail) : null;

  const onAddToList = p => { dispatch({ type: 'toggle-list', id: p.id }); if (!p.onList) showToast(`${p.name} foi para a lista`); };
  const onStillHave = p => { dispatch({ type: 'snooze', id: p.id }); showToast('Beleza, aviso de novo daqui a uns dias'); };
  const onMarkBought = p => { dispatch({ type: 'mark-bought', id: p.id }); };
  const onOpen = p => setDetail(p.id);
  const nav = id => setScreen(id);

  const screens = {
    home: (
      <HomeScreen user={state.user} products={products} settings={state.settings}
        onNav={nav} onAddToList={onAddToList} onStillHave={onStillHave} onOpen={onOpen}
        onAddProduct={() => { setPrefillName(''); setScreen('add'); }} />
    ),
    armario: (
      <ArmarioScreen products={products}
        onboarding={!state.onboarded}
        onBack={() => { dispatch({ type: 'onboarded' }); setScreen('home'); }}
        onSave={items => {
          if (items.length) dispatch({ type: 'add-many', items });
          dispatch({ type: 'onboarded' });
          setScreen('home');
          if (items.length) showToast(`${items.length} ${items.length === 1 ? 'item adicionado' : 'itens adicionados'} à despensa`);
        }} />
    ),
    lista: (
      <ListaScreen products={products} onBack={() => setScreen('home')}
        onToggleList={p => dispatch({ type: 'toggle-list', id: p.id })}
        onFinish={ids => {
          dispatch({ type: 'mark-bought-many', ids });
          showToast('Compra registrada! Previsões reiniciadas.');
          setScreen('home');
        }} />
    ),
    perfil: (
      <PerfilScreen user={state.user} settings={state.settings} receipts={state.receipts} dispatch={dispatch}
        onLogout={() => { dispatch({ type: 'logout' }); setScreen('home'); }} />
    ),
    add: (
      <AddProductScreen products={products} prefillName={prefillName}
        onBack={() => setScreen('home')}
        onScan={() => setScreen('scan')}
        onSave={({ emoji, name, pack, cat, freq, haveIt }) => {
          dispatch({ type: 'add-product', emoji, name, pack, cat, freq, haveIt });
          setScreen('home');
          showToast(`${name} cadastrado`);
        }} />
    ),
    buy: (
      <BuyScreen products={products} onBack={() => setScreen('home')}
        onMarkBought={onMarkBought}
        onScan={() => setScreen('scan')}
        onAddNew={name => { setPrefillName(name); setScreen('add'); }} />
    ),
    scan: (
      <ScanScreen products={products} onBack={() => setScreen('buy')}
        onConfirm={({ ids, newItems, date, note }) => {
          if (ids.length) dispatch({ type: 'mark-bought-many', ids, date });
          if (newItems.length) dispatch({ type: 'add-many', items: newItems, date });
          dispatch({ type: 'receipt', receipt: { key: note.key, uf: note.uf, store: note.store, total: note.total, itemCount: note.itemCount, date } });
          setScreen('home');
          showToast(`Nota registrada · ${note.itemCount} ${note.itemCount === 1 ? 'item' : 'itens'} datados`);
        }} />
    ),
    status: (
      <StatusScreen products={products} onBack={() => setScreen('home')} onOpen={onOpen} onAddToList={onAddToList} />
    ),
  };

  const tabFor = { home: 'home', armario: 'armario', lista: 'lista', perfil: 'perfil', status: 'home' };
  const showNav = ['home', 'armario', 'lista', 'perfil', 'status'].includes(screen) && state.onboarded;

  return (
    <div className="app-shell">
      {screens[screen]}
      {showNav && <BottomNav active={tabFor[screen]} onNav={nav} listCount={listCount} />}

      <Sheet open={!!detailProduct} onClose={() => setDetail(null)}>
        <ProductDetail p={detailProduct}
          onMarkBought={p => { onMarkBought(p); showToast('Anotado! Previsão reiniciada.'); }}
          onAddToList={onAddToList}
          onDelete={p => { dispatch({ type: 'delete-product', id: p.id }); showToast(`${p.name} removido`); }}
          onClose={() => setDetail(null)} />
      </Sheet>

      <Toast msg={toast?.msg || ''} show={!!toast} />
    </div>
  );
}
