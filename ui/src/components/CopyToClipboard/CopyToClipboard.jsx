import { useState } from 'react';
import { CopyToClipboard as TriggerCopyToClipboard } from 'react-copy-to-clipboard';
import { MdContentCopy } from 'react-icons/md';

import TooltipTrigger from '../TooltipTrigger';
import styles from './CopyToClipboard.module.css';

export default function CopyToClipboard(props) {
  const { id, tittle, text, iconColor = 'black' } = props;

  const [copied, setCopied] = useState(false);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  }

  return (
    <TooltipTrigger
      placement={copied ? 'auto' : 'right'}
      rootClose={false}
      id={id}
      tooltipContent={
        copied ? `${tittle} Copied` : `Copy ${tittle} to Clipboard`
      }
    >
      <TriggerCopyToClipboard
        onCopy={onCopy}
        className={styles.link}
        text={text}
      >
        <MdContentCopy color={iconColor} size="1em" />
      </TriggerCopyToClipboard>
    </TooltipTrigger>
  );
}
