import React from 'react';

export default function FlattenButton({ setIsFlat, isFlat }) {
    return (
        <div className="buttongroup">
            <button
                onClick={() => setIsFlat(!isFlat)}
                className={'togglebutton ' + (isFlat ? 'enabled' : '')}
            >
                Flat
            </button>
        </div>
    );
}
