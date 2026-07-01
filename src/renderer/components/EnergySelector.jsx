import PillSelect from './PillSelect';
import { ENERGY_LEVELS } from '../utils/taskHelpers';

export default function EnergySelector({ value, onChange }) {
  return (
    <PillSelect options={ENERGY_LEVELS} value={value} onChange={onChange} />
  );
}
