import {
  ChangeEvent, Dispatch, useContext, useEffect, useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  CommandDialog, CommandEmpty, CommandInput, CommandList, CommandItem,
} from '../ui/command';
import { QUERY_CACHE_PREFIX_KEY, TodoStoreContext } from '@/lib/todo-store/hooks/constants';
import { Route as IndexRoute } from '@/routes/index';
import { formatDateYYYYMMDD } from '@/lib/date';

type SearchModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<boolean>;
};

function SearchModal({
  isOpen,
  setIsOpen,
}: SearchModalProps): React.JSX.Element | null {
  const navigate = useNavigate({ from: IndexRoute.fullPath });
  const [searchTerm, setSearchTerm] = useState('');
  const { searchResults, isLoading } = useSearch(searchTerm);

  const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  let commandEmptyMessage: string;
  switch (true) {
    case isLoading: {
      commandEmptyMessage = 'Loading...';
      break;
    }
    case !searchResults: {
      commandEmptyMessage = 'Search for any past todo content';
      break;
    }
    default: {
      commandEmptyMessage = 'No results found';
    }
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* If ever seeing problems upgrading ^, need to turn filtering off */}
      <CommandInput
        placeholder="Search..."
        onInput={handleSearchTermChange}
        value={searchTerm}
      />
      <CommandList>
        <CommandEmpty>
          {commandEmptyMessage}
        </CommandEmpty>
        {
          searchResults
            ? (
              searchResults.items.map((result) => {
                const handleSelect = () => {
                  setIsOpen(false);
                  navigate({ search: { date: result.createdAt } });
                };
                const formattedDate = formatDateYYYYMMDD(result.createdAt);

                return (
                  <CommandItem
                    key={result.id}
                    onSelect={handleSelect}
                    value={result.id}
                    className="flex w-full !px-6 justify-between transition-opacity hover:!opacity-100 hover:cursor-pointer !pointer-events-auto"
                    data-disabled={null}
                  >
                    <span className="inline-block max-w-[60%] whitespace-nowrap overflow-hidden text-ellipsis">
                      {result.content}
                    </span>
                    <span>
                      {formattedDate}
                    </span>
                  </CommandItem>
                );
              })
            ) : null
        }
      </CommandList>
    </CommandDialog>
  );
}

export default SearchModal;

function useSearch(query: string) {
  const { store } = useContext(TodoStoreContext);
  const [enabled, setEnabled] = useState(false);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: [QUERY_CACHE_PREFIX_KEY, 'search', query],
    queryFn: store ? () => (
      store.fulltextSearch(query)
    ) : undefined,
    enabled,
  });

  // Debounce, validate query
  useEffect(() => {
    if (!store) {
      return setEnabled(false);
    }

    if (query.length <= 2) {
      return setEnabled(false);
    }

    const debounceTimeout = setTimeout(() => {
      setEnabled(true);
    }, 200);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [query, store]);

  return {
    searchResults,
    isLoading,
  };
}
