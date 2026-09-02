import { createContext, useContext } from 'react';

// Pages call useSetTopbar() and pass { title, subtitle, actions } to control the Topbar.
// MainLayout is the provider — it owns the state and renders <Topbar />.
export const TopbarContext = createContext(() => {});
export const useSetTopbar = () => useContext(TopbarContext);
