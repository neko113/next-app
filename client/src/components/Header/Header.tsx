import Link from 'next/link';

const Header = () => {
  return (
    <div>
      <Link href={'/'}>Home</Link>
      <Link href={'/about'}>About</Link>
      <Link href={'/counter'}>Counter</Link>
      <Link href={'/write'}>Write</Link>
    </div>
  );
};

export default Header;
