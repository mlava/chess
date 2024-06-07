import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import React from 'react';
import { ChessPuzzle } from "@react-chess-tools/react-chess-puzzle";

const ChessElement = ({ blockUid }) => {
    let pgn, fenString, moveString;
    let moves = [];

    let blockData = window.roamAlphaAPI.data.pull("[:node/title :block/string :block/uid {:block/children ...} {:block/parents ...}]", `[:block/uid \"${blockUid}\"]`);
    for (var i = 0; i < blockData[":block/parents"].length; i++) {
        if (blockData[":block/parents"][i][":block/string"] == "**Lichess Puzzle of the Day:**") {
            if (blockData[":block/parents"][i].hasOwnProperty([":block/children"])) {
                if (blockData[":block/parents"][i][":block/children"][0].hasOwnProperty([":block/children"])) {
                    if (blockData[":block/parents"][i][":block/children"][0][":block/children"][1].hasOwnProperty([":block/children"])) {
                        if (blockData[":block/parents"][i][":block/children"][0][":block/children"][1].hasOwnProperty([":block/children"])) {
                            pgn = blockData[":block/parents"][i][":block/children"][0][":block/children"][1][":block/children"][0][":block/string"];
                            pgn = pgn.split("^^")[1];
                            fenString = blockData[":block/parents"][i][":block/children"][0][":block/children"][1][":block/children"][1][":block/string"];
                            fenString = fenString.split("^^")[1].toString();
                            moveString = blockData[":block/parents"][i][":block/children"][0][":block/children"][1][":block/children"][2][":block/string"];
                            moveString = moveString.split("^^")[1].toString();
                            moveString = moveString.split("[")[1].toString();
                            moveString = moveString.split("]")[0].toString();
                            moveString = moveString.split('"');
                            for (var j = 0; j < moveString.length; j++) {
                                if (j % 2 == 1) {
                                    moves.push(moveString[j])
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return (
        <ChessPuzzle.Root puzzle={{
            fen: fenString,
            moves: moves,
            makeFirstMove: true,
        }}
        >
            <ChessPuzzle.Board />
            <ChessPuzzle.Hint>Hint</ChessPuzzle.Hint>
            <ChessPuzzle.Reset asChild={true} showOn={["not-started", "in-progress", "solved", "failed"]}>
                <button>Reset</button>
            </ChessPuzzle.Reset>
        </ChessPuzzle.Root >
    )
};

export const renderChessboard = createComponentRender(
    ({ blockUid }) => <ChessElement blockUid={blockUid} />,
    "chess-element-parent"
);