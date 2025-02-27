import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  ShellSchema,
  SHELL_SCHEMA_OPTIONS,
} from '../../../../shared/src/lib/shared';

export const ShellSelect: React.FC<{
  defaultShell: ShellSchema;
  shell: ShellSchema;
  setShell: React.Dispatch<React.SetStateAction<ShellSchema>>;
  helperText?: string;
}> = ({ defaultShell, shell, setShell, helperText }) => {
  return (
    <FormControl>
      <InputLabel id="select-shell-label">Shell</InputLabel>
      <Select
        labelId="select-shell-label"
        id="select-shell"
        label="Shell"
        defaultValue={defaultShell}
        value={shell}
        onChange={(e) => setShell(e.target.value as ShellSchema)}
      >
        {Object.keys(SHELL_SCHEMA_OPTIONS).map((shell) => (
          <MenuItem key={shell} value={shell}>
            {shell}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
