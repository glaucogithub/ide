import React, { useEffect, useState } from 'react';
import { useUpdateAtom } from 'jotai/utils';
import { fileIdAtom } from '../atoms/firebaseAtoms';
import firebase from 'firebase/app';
import { navigate, RouteComponentProps } from '@reach/router';
import { MessagePage } from '../components/MessagePage';

export interface CopyFilePageProps extends RouteComponentProps {
  fileId?: string;
}

export default function CopyFilePage(props: CopyFilePageProps): JSX.Element {
  const setFileId = useUpdateAtom(fileIdAtom);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let queryId: string | null = props.fileId ?? null;

    if (queryId?.length !== 19) {
      queryId = null;
      alert('Error: Bad URL');
      navigate('/', { replace: true });
      return;
    }

    const oldRef = firebase.database().ref(`-${queryId}`);
    const newRef = firebase.database().ref().push();
    const keysToCopy = [
      'editor-cpp',
      'editor-java',
      'editor-py',
      'settings',
      'input',
    ];
    Promise.all(keysToCopy.map(key => oldRef.child(key).once('value')))
      .then(async data => {
        const updateObject: { [key: string]: unknown } = {};
        keysToCopy.forEach((key, idx) => {
          // we don't want to copy over user information or settings/defaultPermission for firepad
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { users, defaultPermission, ...toKeep } = data[idx].val() || {};
          updateObject[key] = toKeep;
        });
        await newRef.set(updateObject);
        setFileId({
          newId: newRef.key!.slice(1), // first character is dash which we want to ignore
          isNewFile: true,
        });
      })
      .catch(e => {
        if (e.code === 'PERMISSION_DENIED') {
          setPermissionDenied(true);
        } else {
          alert('Failed to clone file: ' + e.message);
          throw new Error(e.message);
        }
      });
  }, [props.fileId, setFileId]);

  if (permissionDenied) {
    return <MessagePage message="This file is private." />;
  }

  return <MessagePage message="Copying file..." showHomeButton={false} />;
}
