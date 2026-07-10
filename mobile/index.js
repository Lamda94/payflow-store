/**
 * @format
 */

// Must run before any crypto-js usage (store/persist encryption key
// generation): provides the secure RNG crypto-js needs on Hermes/RN.
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './App';
import { name as appName } from './app.json';

enableScreens();

AppRegistry.registerComponent(appName, () => App);
