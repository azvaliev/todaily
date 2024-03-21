import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DatePickerHeaderProps } from './types';
import { StaticDatePickerHeader } from './static';

function FullDatePickerHeader({ date, setDate }: DatePickerHeaderProps): React.JSX.Element {
  const [datepickerOpen, setDatepickerOpen] = useState(false);
  const handleSelect = (newDate: Date | undefined) => {
    setDatepickerOpen(false);
    if (newDate) {
      setDate(newDate);
    }
  };

  return (
    <Popover open={datepickerOpen} onOpenChange={setDatepickerOpen}>
      <PopoverTrigger asChild>
        <StaticDatePickerHeader date={date} setDate={setDate} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { FullDatePickerHeader };
