/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '-/components/Tooltip';
import AppConfig from '-/AppConfig';
import { Pro } from '../pro';
import TextLogoIcon from '-/assets/images/text-logo.svg';
import LogoIcon from '-/assets/images/icon100x100.svg';
import versionMeta from '../version.json';
import { actions } from '-/reducers/app';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

function CustomLogo() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const tsType = Pro ? 'PRO' : 'LITE';

  const logo = useMemo(() => {
    let customLogo = TextLogoIcon;
    // if (AppConfig.isWeb) {
    //   customLogo = WebLogoIcon;
    // }
    if (AppConfig.customLogo) {
      customLogo = AppConfig.customLogo;
    }
    return customLogo;
  }, []);

  return (
    <Box
      onClick={() => dispatch(actions.toggleAboutDialog())}
      style={{ width: '100%', textAlign: 'center' }}
    >
      <Tooltip title={t('core:aboutTitle')}>
        <IconButton style={{ padding: 0 }}>
          <img
            style={{
              width: 30,
              height: 30,
            }}
            src={LogoIcon}
            alt="TagSpaces Logo"
          />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('core:aboutTitle')}>
        <IconButton
          style={{ height: 40, padding: 0 }}
          data-tid="aboutTagSpaces"
        >
          <img
            style={{ maxHeight: 26, maxWidth: 200 }}
            src={logo}
            alt="TagSpaces"
          />
        </IconButton>
      </Tooltip>
      <sup>
        <Typography
          style={{
            display: 'inline',
            fontSize: '10px',
            marginLeft: 3,
            lineHeight: '40px',
          }}
        >
          {'v' + versionMeta.version}
        </Typography>
      </sup>
      <sub>
        <Typography
          style={{
            display: 'inline',
            fontSize: '10px',
            marginLeft: -25,
            lineHeight: '40px',
          }}
        >
          {tsType}
        </Typography>
      </sub>
    </Box>
  );
}

export default CustomLogo;
