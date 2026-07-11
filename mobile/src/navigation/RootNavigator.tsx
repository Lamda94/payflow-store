import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../ui/screens/SplashScreen';
import { HomeScreen } from '../ui/screens/HomeScreen';
import { ProductDetailScreen } from '../ui/screens/ProductDetailScreen';
import { CheckoutScreen } from '../ui/screens/CheckoutScreen';
import { HistoryScreen } from '../ui/screens/HistoryScreen';
import { colors } from '../ui/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'PayFlow Store' }} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Product' }}
        />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Purchase history' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
