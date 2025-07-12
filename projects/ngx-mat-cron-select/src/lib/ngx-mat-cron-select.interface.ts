export enum ECronSelectTab {
  hour = 0,
  day = 1,
  week = 2,
  month = 3,
  year = 4,
}

export interface IInputsFormGroup {
  dayOfMonth: number[] | null;
  dayOfWeek: number[] | null;
  hour: number[] | null;
  minute: number[] | null;
  monthOfYear: number[] | null;
}
