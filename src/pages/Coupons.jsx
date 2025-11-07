import CouponManager from '../components/CouponManager';

export default function Coupons() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <CouponManager />
      </div>
    </div>
  );
}
