import React, {
  Fragment,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Dialog, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { XIcon } from '@heroicons/react/outline';
import { WorkspaceSettings, useSettings } from '../SettingsContext';
import { useAtom } from 'jotai';
import { actualUserPermissionAtom } from '../../atoms/workspace';
import {
  authenticatedUserRefAtom,
  firebaseUserAtom,
} from '../../atoms/firebaseAtoms';
import {
  EditorMode,
  editorModeAtomWithPersistence,
  userNameAtom,
} from '../../atoms/userSettings';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import {
  DesktopComputerIcon,
  ServerIcon,
  UserIcon,
} from '@heroicons/react/solid';
import UserSettings from './UserSettings';
import WorkspaceSettingsUI from './WorkspaceSettingsUI';
import JudgeSettings from './JudgeSettings';

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabs = [
  {
    id: 'workspace',
    label: 'Workspace',
    icon: DesktopComputerIcon,
  },
  {
    id: 'user',
    label: 'User',
    icon: UserIcon,
  },
  {
    id: 'judge',
    label: 'Judge',
    icon: ServerIcon,
  },
] as const;

export const SettingsModal = ({
  isOpen,
  onClose,
}: SettingsDialogProps): JSX.Element => {
  const {
    settings: realWorkspaceSettings,
    setSettings: setRealWorkspaceSettings,
  } = useSettings();
  const userRef = useAtomValue(authenticatedUserRefAtom);
  const dirtyRef = useRef<boolean>(false);
  const [workspaceSettings, setWorkspaceSettings] = useReducer(
    (prev: WorkspaceSettings, next: Partial<WorkspaceSettings>) => {
      return {
        ...prev,
        ...next,
      };
    },
    realWorkspaceSettings
  );
  const [userPermission] = useAtom(actualUserPermissionAtom);
  const [firebaseUser] = useAtom(firebaseUserAtom);
  const setUserNameAtom = useUpdateAtom(userNameAtom);
  const [name, setName] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('Normal');
  const editorModeAtom = useAtom(editorModeAtomWithPersistence);
  const [tab, setTab] = useState<typeof tabs[number]['id']>('workspace');

  useEffect(() => {
    if (isOpen) {
      setWorkspaceSettings(realWorkspaceSettings);
      setName(firebaseUser?.displayName || null);
      setEditorMode(editorModeAtom[0]);
      dirtyRef.current = false;
      setTab('workspace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const closeWithoutSaving = () => {
    if (dirtyRef.current) {
      if (
        confirm('Are you sure you want to exit without saving your changes?')
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const saveAndClose = () => {
    setRealWorkspaceSettings(workspaceSettings);
    editorModeAtom[1](editorMode);
    if (name !== firebaseUser?.displayName) {
      firebaseUser?.updateProfile({
        displayName: name,
      });
      userRef?.child('name').set(name);
      setUserNameAtom(name);
    }
    onClose();
  };

  const onChange = (data: Partial<WorkspaceSettings>): void => {
    dirtyRef.current = true;
    setWorkspaceSettings(data);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        open={isOpen}
        onClose={() => onClose()}
      >
        <div className="flex items-end justify-center min-h-full pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block bg-white md:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl w-full">
              <div className="px-4 sm:px-6 pt-4 pb-2">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 font-medium text-gray-900 text-center"
                >
                  Settings
                </Dialog.Title>
              </div>

              <div>
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex">
                    {tabs.map(settingTab => (
                      <button
                        className={classNames(
                          tab === settingTab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                          'w-1/2 group flex items-center justify-center py-3 px-1 border-b-2 font-medium text-sm focus:outline-none'
                        )}
                        onClick={() => setTab(settingTab.id)}
                        key={settingTab.id}
                      >
                        <settingTab.icon
                          className={classNames(
                            tab === settingTab.id
                              ? 'text-indigo-500'
                              : 'text-gray-400 group-hover:text-gray-500',
                            '-ml-0.5 mr-2 h-5 w-5'
                          )}
                        />
                        {settingTab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {tab === 'user' && (
                  <UserSettings
                    name={name || ''}
                    onNameChange={name => {
                      setName(name);
                      dirtyRef.current = true;
                    }}
                    editorMode={editorMode}
                    onEditorModeChange={mode => {
                      setEditorMode(mode);
                      dirtyRef.current = true;
                    }}
                  />
                )}
                {tab === 'workspace' && (
                  <WorkspaceSettingsUI
                    workspaceSettings={workspaceSettings}
                    onWorkspaceSettingsChange={onChange}
                    userPermission={userPermission || 'READ'}
                  />
                )}
                {tab === 'judge' && (
                  <JudgeSettings
                    workspaceSettings={workspaceSettings}
                    onWorkspaceSettingsChange={onChange}
                    userPermission={userPermission || 'READ'}
                  />
                )}

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => closeWithoutSaving()}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => saveAndClose()}
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => closeWithoutSaving()}
                >
                  <span className="sr-only">Close</span>
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
