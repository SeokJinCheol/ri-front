import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from "@/providers";
import {AppRoutes} from "@/routes";

function App() {
  return (
      <AppProviders>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
              <AppRoutes />
          </BrowserRouter>
      </AppProviders>
  );
}

export default App;
