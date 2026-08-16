import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { beautifyExactDate } from '~/utils/date-utils';

const StyledDivider = styled.div`
  align-self: center;
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: ${themeCssVariables.spacing[2]} 0;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
`;

type WhatsappMessageDayDividerProps = {
  dayDate: Date;
};

export const WhatsappMessageDayDivider = ({
  dayDate,
}: WhatsappMessageDayDividerProps) => (
  <StyledDivider>{beautifyExactDate(dayDate)}</StyledDivider>
);
