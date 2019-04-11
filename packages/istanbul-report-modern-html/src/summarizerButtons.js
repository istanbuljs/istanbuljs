import * as React from 'react';

function SummarizerButton({
    summarizerType,
    activeSummarizerType,
    setSummarizerType,
    children
}) {
    return (
        <button
            onClick={() => setSummarizerType(summarizerType)}
            class={
                'togglebutton ' +
                (summarizerType === activeSummarizerType ? 'enabled' : '')
            }
        >
            {children}
        </button>
    );
}

export default function SummarizerButtons({
    setSummarizerType,
    summarizerType
}) {
    return (
        <div class="buttongroup">
            <label>Summarizer:</label>
            <SummarizerButton
                setSummarizerType={setSummarizerType}
                summarizerType="package"
                activeSummarizerType={summarizerType}
            >
                Package
            </SummarizerButton>
            <SummarizerButton
                setSummarizerType={setSummarizerType}
                summarizerType="nested"
                activeSummarizerType={summarizerType}
            >
                Nested
            </SummarizerButton>
            <SummarizerButton
                setSummarizerType={setSummarizerType}
                summarizerType="flat"
                activeSummarizerType={summarizerType}
            >
                Flat
            </SummarizerButton>
        </div>
    );
}
