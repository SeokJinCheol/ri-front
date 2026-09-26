import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AppProviders } from "@/providers";
import {AppRoutes} from "@/routes";

function App() {
  const desktop = import.meta.env.MODE === 'electron' || !!window.api;
  const Router = desktop ? HashRouter : BrowserRouter;
  return (
      <AppProviders>
          <Router basename={desktop ? undefined : import.meta.env.BASE_URL}>
              <AppRoutes />
          </Router>
      </AppProviders>
  );
}

export default App;
