import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ArchiveBanner } from './ArchiveBanner';
import { useViewing } from '../../contexts/ViewingContext';

export function Layout() {
  const { isViewingArchive } = useViewing();

  return (
    <>
      <Sidebar />
      <main className={`main-content ${isViewingArchive ? 'main-content-archive' : ''}`}>
        <ArchiveBanner />
        <Outlet />
      </main>
    </>
  );
}
