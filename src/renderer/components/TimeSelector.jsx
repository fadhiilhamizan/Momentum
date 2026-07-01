import PillSelect from './PillSelect';
import { TIME_ESTIMATES } from '../utils/taskHelpers';

export default function TimeSelector({ value, onChange }) {
  return (
    <PillSelect
      options={TIME_ESTIMATES}
      value={value}
      onChange={onChange}
      allowClear
    />
  );
}
