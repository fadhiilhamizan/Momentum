import PillSelect from './PillSelect';
import { PRIORITIES } from '../utils/taskHelpers';

export default function PrioritySelector({ value, onChange }) {
  return <PillSelect options={PRIORITIES} value={value} onChange={onChange} />;
}
