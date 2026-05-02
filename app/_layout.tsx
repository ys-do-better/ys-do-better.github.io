import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profile/index" options={{ title: '个人介绍' }} />
        <Stack.Screen name="photos/index" options={{ title: '照片集合' }} />
        <Stack.Screen name="growth/index" options={{ title: '成长轨迹' }} />
        <Stack.Screen name="mood/index" options={{ title: '情绪管理' }} />
        <Stack.Screen name="baby/index" options={{ title: '霄霄日记' }} />
        <Stack.Screen name="health/index" options={{ title: '健康管理' }} />
        <Stack.Screen name="finance/index" options={{ title: '投资理财' }} />
        <Stack.Screen name="books/index" options={{ title: '书籍阅读' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
