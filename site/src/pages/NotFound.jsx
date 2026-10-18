import { Empty, Link } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <Empty title="No such page" style={{ marginTop: 40 }}>
      <p style={{ margin: '0 0 14px' }}>The artifact may have been removed or renamed.</p>
      <Link className="btn sm" to={{ name: 'home' }}>Go home</Link>
    </Empty>
  );
}
