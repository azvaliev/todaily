import { useState } from 'react';
import SearchIcon from '@/components/icons/search';
import SearchModal from './modal';

function Search(): React.JSX.Element | null {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)}>
        <SearchIcon />
      </button>
      <SearchModal isOpen={searchOpen} setIsOpen={setSearchOpen} />
    </>
  );
}

export default Search;
