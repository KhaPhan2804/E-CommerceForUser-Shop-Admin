import AppNavigation from "./navigation/AppNavigation";
import { store } from '../store'
import { Provider } from 'react-redux'

export default function Index() {
  return (
    <Provider store={store}>
      <AppNavigation /> 
    </Provider>
  );
}
