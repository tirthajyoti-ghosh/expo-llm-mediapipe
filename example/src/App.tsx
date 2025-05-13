import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

import HookDownloadableDemoScreen from './screens/HookDownloadableDemoScreen';
import HookAssetDemoScreen from './screens/HookAssetDemoScreen';
import HooklessDownloadableDemoScreen from './screens/HooklessDownloadableDemoScreen';
import HooklessAssetDemoScreen from './screens/HooklessAssetDemoScreen';
import HooklessUtilityDemoScreen from './screens/HooklessUtilityDemoScreen';

type DemoScreen =
  | 'HookDownloadable'
  | 'HookAsset'
  | 'HooklessDownloadable'
  | 'HooklessAsset'
  | 'HooklessUtility';

const App = () => {
  const [activeScreen, setActiveScreen] = useState<DemoScreen>('HooklessUtility');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'HookDownloadable':
        return <HookDownloadableDemoScreen />;
      case 'HookAsset':
        return <HookAssetDemoScreen />;
      case 'HooklessDownloadable':
        return <HooklessDownloadableDemoScreen />;
      case 'HooklessAsset':
        return <HooklessAssetDemoScreen />;
      case 'HooklessUtility':
        return <HooklessUtilityDemoScreen />;
      default:
        return <Text>Select a demo</Text>;
    }
  };

  const NavButton: React.FC<{ title: string; screen: DemoScreen }> = ({ title, screen }) => (
    <TouchableOpacity
      style={[styles.navButton, activeScreen === screen && styles.navButtonActive]}
      onPress={() => setActiveScreen(screen)}
    >
      <Text style={[styles.navButtonText, activeScreen === screen && styles.navButtonTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Expo LLM Mediapipe Examples</Text>
      </View>
      <View style={styles.navContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScrollView}>
          <NavButton title="Hookless: Utility" screen="HooklessUtility" />
          <NavButton title="Hookless: Download" screen="HooklessDownloadable" />
          <NavButton title="Hookless: Asset" screen="HooklessAsset" />
          <NavButton title="Hook: Asset" screen="HookAsset" />
          <NavButton title="Hook: Download" screen="HookDownloadable" />
        </ScrollView>
      </View>
      <View style={styles.screenContainer}>{renderScreen()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFEFF4',
    paddingVertical: 5,
  },
  navScrollView: {
    paddingHorizontal: 5,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  navButtonActive: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  navButtonTextActive: {
    color: 'white',
  },
  screenContainer: {
    flex: 1,
    // backgroundColor: 'white', // Content screens will manage their own background
  },
});

export default App;