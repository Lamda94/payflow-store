/**
 * @format
 */

// Must run before any crypto-js usage (store/persist encryption key
// generation): provides the secure RNG crypto-js needs on Hermes/RN.
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
