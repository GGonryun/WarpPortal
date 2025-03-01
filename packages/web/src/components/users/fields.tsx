import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { ShellSchema, SHELL_SCHEMA_OPTIONS } from '@warpportal/shared';

export const ShellSelect: React.FC<{
  defaultShell: ShellSchema;
  shell: ShellSchema;
  setShell: React.Dispatch<React.SetStateAction<ShellSchema>>;
  helperText?: string;
  disabled?: boolean;
}> = ({ defaultShell, shell, setShell, helperText, disabled }) => {
  return (
    <FormControl>
      <InputLabel id="select-shell-label">Shell</InputLabel>
      <Select
        labelId="select-shell-label"
        id="select-shell"
        label="Shell"
        disabled={disabled}
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
