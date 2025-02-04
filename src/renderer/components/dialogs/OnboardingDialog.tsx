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

import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigation, Pagination } from 'swiper/modules';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import BrowserExtension from '-/assets/images/collectcontent.svg';
import WizardFinished from '-/assets/images/computer-desk.svg';
import ChooseTagging from '-/assets/images/abacus.svg';
import NewLook from '-/assets/images/desktop.svg';
import {
  getCurrentTheme,
  getPersistTagsInSidecarFile,
  actions as SettingsActions,
} from '-/reducers/settings';
import DialogCloseButton from '-/components/dialogs/DialogCloseButton';
import Links from 'assets/links';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { openURLExternally } from '-/services/utils-io';
import { AppDispatch } from '-/reducers/app';

import { register } from 'swiper/element/bundle';
import { useTranslation } from 'react-i18next';

register();

interface Props {
  classes: any;
  open: boolean;
  onClose: () => void;
}

function OnboardingDialog(props: Props) {
  const { t } = useTranslation();
  //const [activeStep, setActiveStep] = useState(0);
  const { open, onClose } = props;
  const isPersistTagsInSidecar = useSelector(getPersistTagsInSidecarFile);
  const currentTheme = useSelector(getCurrentTheme);
  const dispatch: AppDispatch = useDispatch();
  const swiperElRef = useRef(null); //<SwiperRef>

  /*useEffect(() => {
  if(swiperElRef.current){
    // listen for Swiper events using addEventListener
    swiperElRef.current.addEventListener('progress', (e) => {
      const [swiper, progress] = e.detail;
      console.log(progress);
    });

    swiperElRef.current.addEventListener('slidechange', (e) => {
      console.log('slide changed');
    });
    }
  }, []);*/

  const setPersistTagsInSidecarFile = (isPersistTagsInSidecar) => {
    dispatch(
      SettingsActions.setPersistTagsInSidecarFile(isPersistTagsInSidecar),
    );
  };
  //const maxSteps = 4;

  const setCurrentTheme = (theme) => {
    dispatch(SettingsActions.setCurrentTheme(theme));
  };

  const toggleTaggingType = () => {
    setPersistTagsInSidecarFile(!isPersistTagsInSidecar);
  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      fullScreen={fullScreen}
      scroll="paper"
    >
      <DialogTitle style={{ justifyContent: 'center', textAlign: 'center' }}>
        <DialogCloseButton testId="closeOnboardingDialog" onClose={onClose} />
      </DialogTitle>
      <DialogContent
        style={{
          marginTop: 20,
          overflowY: 'auto',
        }}
      >
        <style>
          {`
        swiper-container::part(bullet-active) {
          background-color: ${theme.palette.primary.main};
        }
        swiper-container::part(button-prev) {
          color: ${theme.palette.primary.main};
        }
        swiper-container::part(button-next) {
          color: ${theme.palette.primary.main};
        }
        `}
        </style>
        <swiper-container
          ref={swiperElRef}
          slidesPerView={1}
          navigation="true"
          pagination={{
            clickable: true,
          }}
          modules={[Pagination, Navigation]}
        >
          <swiper-slide>
            <div
              style={{
                textAlign: 'center',
                overflowX: 'hidden',
                padding: 50,
              }}
            >
              <Typography variant="h5">
                {t('core:welcomeToTagSpaces')}
              </Typography>
              <img
                style={{ maxHeight: 300, marginTop: 15, marginBottom: 40 }}
                src={NewLook}
                alt=""
              />
              <Typography variant="h6">Try our dark theme!</Typography>
              <Typography variant="h6">&nbsp;</Typography>
              <ToggleButtonGroup
                value={currentTheme}
                exclusive
                onChange={(event, theme) => {
                  setCurrentTheme(theme);
                }}
                style={{ boxShadow: 'none' }}
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
              </ToggleButtonGroup>
            </div>
          </swiper-slide>
          <swiper-slide>
            <div
              style={{
                textAlign: 'center',
                padding: 50,
              }}
            >
              <Typography variant="h5">
                Choose your the default tagging method for files
              </Typography>
              <Typography variant="h5">&nbsp;</Typography>
              <Typography variant="body1">
                Core functionality of the application the tagging of files and
                folders. Here you can choose how tags will attached to files.
              </Typography>
              <FormControl
                style={{ marginTop: 20, marginBottom: 20 }}
                component="fieldset"
              >
                <RadioGroup
                  aria-label="fileTaggingType"
                  name="isPersistTagsInSidecar"
                  onChange={toggleTaggingType}
                >
                  <FormControlLabel
                    value="false"
                    control={<Radio checked={!isPersistTagsInSidecar} />}
                    label={
                      <Typography
                        variant="subtitle1"
                        style={{ textAlign: 'left' }}
                      >
                        Use the name of file for saving the tags - Tagging the
                        file <strong>image.jpg</strong> with a tag{' '}
                        <strong>sunset</strong> will rename it to{' '}
                        <strong>image[sunset].jpg</strong>
                      </Typography>
                    }
                  />

                  <FormControlLabel
                    style={{ marginTop: 20 }}
                    value="true"
                    control={<Radio checked={isPersistTagsInSidecar} />}
                    label={
                      <Typography
                        variant="subtitle1"
                        style={{ textAlign: 'left' }}
                      >
                        Use sidecar file for saving the tags - Tagging the file{' '}
                        <strong>image.jpg</strong> with a tag{' '}
                        <strong>sunset</strong> will save this tag in an
                        additional sidecar file called{' '}
                        <strong>image.jpg.json</strong> located in a sub folder
                        with the name
                        <strong>.ts</strong>
                      </Typography>
                    }
                  />
                  <img
                    style={{ maxHeight: 200, marginTop: 15 }}
                    src={ChooseTagging}
                    alt=""
                  />
                </RadioGroup>
              </FormControl>
              <Typography variant="body1">
                You can always revise you decision and change the tagging
                method. But files already tagged with the renaming method will
                stay renamed and the created sidecar file with the tags will
                stay.
              </Typography>
            </div>
          </swiper-slide>
          <swiper-slide>
            <div
              style={{
                textAlign: 'center',
                padding: 50,
              }}
            >
              <Typography variant="h5">
                Collect web pages, create bookmarks or take screenshot from
                websites directly in your web browser.
              </Typography>
              <img
                style={{ maxHeight: 300, marginTop: 15, marginBottom: 20 }}
                src={BrowserExtension}
                alt=""
              />
              <Typography variant="h6">
                Check out our web clipper browser extension for Chrome, Edge and
                Firefox.
              </Typography>
              <Typography variant="h6">
                It is available for free in the official browser stores.
              </Typography>
              <Button
                style={{ marginTop: 20 }}
                onClick={() => {
                  openURLExternally(Links.links.webClipper, true);
                }}
                variant="contained"
                color="primary"
              >
                Get the web clipper
              </Button>
            </div>
          </swiper-slide>
          <swiper-slide>
            <div
              style={{
                textAlign: 'center',
                padding: 50,
              }}
            >
              <Typography variant="h5">
                We hope you will love TagSpaces as much as we do!
              </Typography>
              <img
                style={{ maxHeight: 300, maxWidth: '90%', marginTop: 100 }}
                src={WizardFinished}
                alt=""
              />
              <Typography variant="h6">
                If you want to learn more about the application, you can start
                the introduction from the welcome screen.
              </Typography>
              <Button
                style={{ marginTop: 20 }}
                onClick={onClose}
                variant="contained"
                color="primary"
              >
                Start using TagSpaces
              </Button>
            </div>
          </swiper-slide>
        </swiper-container>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingDialog;
