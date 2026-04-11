import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function Layout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: '图推动态解析', headerShown: false }} />
        <Stack.Screen name="analysis" options={{ title: '分析结果' }} />
        <Stack.Screen name="spatial" options={{ title: '3D立体演示' }} />
        <Stack.Screen name="history" options={{ title: '历史记录' }} />
        <Stack.Screen name="settings" options={{ title: '设置' }} />
      </Stack>
    </PaperProvider>
  );
}
