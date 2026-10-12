import { useAppSelector } from '@/hooks/redux.hook';
import { AuthPage } from '@/pages/auth.page';
import { ChatPage } from '@/pages/chat.page';
import { selectInstance } from '@/store/slices/auth.slice';

export const App = () => {
  const instance = useAppSelector(selectInstance);

  return instance ? <ChatPage /> : <AuthPage />;
};
