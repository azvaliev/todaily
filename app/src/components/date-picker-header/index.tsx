import { useEffect, useState } from 'react';
import { DatePickerHeaderProps } from './types';
import { StaticDatePickerHeader } from './static';

/**
 * Shows a static date picker header without the date picker functionality
 * Lazily loads the actual date picker header
 * */
function DatePickerHeader(props: DatePickerHeaderProps): React.JSX.Element {
  const [
    DatePickerHeaderComponent,
    setDatePickerHeaderComponent,
  ] = useState<typeof DatePickerHeader>();

  useEffect(() => {
    import('./full')
      .then((mod) => setDatePickerHeaderComponent(() => mod.FullDatePickerHeader));
  }, []);

  if (!DatePickerHeaderComponent) {
    return <StaticDatePickerHeader {...props} />;
  }

  return <DatePickerHeaderComponent {...props} />;
}

export { DatePickerHeader };
