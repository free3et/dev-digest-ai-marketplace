import { Empty, Link } from '../components/ui.jsx';
import { t } from '../lib/i18n.jsx';

export default function NotFound() {
  return (
    <Empty title={t('notFound.title')} style={{ marginTop: 40 }}>
      <p style={{ margin: '0 0 14px' }}>{t('notFound.body')}</p>
      <Link className="btn sm" to={{ name: 'home' }}>{t('notFound.home')}</Link>
    </Empty>
  );
}
