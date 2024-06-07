import { renderChessboard } from "./chessComponent";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createBlock from "roamjs-components/writes/createBlock";

var runners = {
    observers: [],
}

const config = {
    tabTitle: "Chess Puzzle of the Day",
    settings: [
        {
            id: "chess-rAPI-key",
            name: "RapidAPI Key",
            description: "Your API Key for RapidAPI from https://rapidapi.com/KeeghanM/api/chess-puzzles",
            action: { type: "input", placeholder: "Add RapidAPI API key here" },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        const onloadArgs = { extensionAPI };
        const chessObserver = createButtonObserver({
            attribute: 'chess',
            render: (b) => {
                renderChessboard(b, onloadArgs)
            }
        });
        runners['observers'] = [chessObserver];

        extensionAPI.settings.panel.create(config);

        extensionAPI.ui.commandPalette.addCommand({
            label: "Import the daily Chess puzzle from Lichess",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing a puzzle");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchChessPuzzle(uid);
            }
        });

        const args = {
            text: "CHESSPUZZLE",
            help: "Import the daily Chess puzzle from Lichess",
            handler: (context) => {
                window.roamAlphaAPI.updateBlock(
                    { block: { uid: context.triggerUid, string: "Loading...".toString(), open: true } });
                fetchChessPuzzle(context.triggerUid);
            }
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args)
            );
        }

        async function fetchChessPuzzle(blockUid) {
            var rAPIkey, key, fen;
            var titleString = "**Lichess Puzzle of the Day:**";
            var moves = "[";

            breakme: {
                if (!extensionAPI.settings.get("chess-rAPI-key")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else {
                    rAPIkey = extensionAPI.settings.get("chess-rAPI-key");

                    const response = await fetch("https://lichess.org/api/puzzle/daily");
                    const data = await response.json();

                    var myHeaders = new Headers();
                    myHeaders.append("X-RapidAPI-Key", rAPIkey);
                    myHeaders.append("X-RapidAPI-Host", "chess-puzzles.p.rapidapi.com");
                    var requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    };

                    await fetch("https://chess-puzzles.p.rapidapi.com/?id=" + data.puzzle.id, requestOptions)
                        .then(response => response.json())
                        .then(result => {
                            fen = result.puzzles[0].fen;
                            for (var j = 0; j < result.puzzles[0].moves.length - 1; j++) {
                                moves += "\"" + result.puzzles[0].moves[j] + "\", "
                            }
                            moves += "\"" + result.puzzles[0].moves[result.puzzles[0].moves.length - 1] + "\"]";
                        })
                        .catch(error => console.log('error', error));

                    var source = "[Solution](https://lichess.org/training/" + data.puzzle.id + ")";
                    var versus = "[[";
                    if (data.game.players[0].color == "white") {
                        versus += data.game.players[0].name + "]] (White, " + data.game.players[0].rating + ") vs [[" + data.game.players[1].name + "]] (Black, " + data.game.players[1].rating + ")";
                    } else {
                        versus += data.game.players[1].name + "]] (White, " + data.game.players[1].rating + ") vs [[" + data.game.players[0].name + "]] (Black, " + data.game.players[0].rating + ")";
                    }

                    // setTimeout is needed because sometimes block is left blank
                    setTimeout(async () => {
                        await window.roamAlphaAPI.updateBlock({ "block": { "uid": blockUid, "string": titleString } });

                        await createBlock({
                            node: {
                                text: "[[" + data.game.perf.name + "]] [[" + data.game.clock + "]]",
                                children: [
                                    {
                                        text: versus,
                                    },
                                    {
                                        text: "{{chess}}",
                                        children: [
                                            {
                                                text: "PGN: #lichess-pgn^^" + data.game.pgn + "^^",
                                            },
                                            {
                                                text: "FEN: #lichess-fen^^" + fen + "^^",
                                            },
                                            {
                                                text: "Moves: #lichess-fen^^" + moves + "^^",
                                            }
                                        ]
                                    },
                                    {
                                        text: source,
                                    },

                                ],
                            },
                            parentUid: blockUid,
                        });
                        let blockData = window.roamAlphaAPI.data.pull("[:node/title :block/uid :block/string {:block/children ...}]", `[:block/uid \"${blockUid}\"]`);
                        await window.roamAlphaAPI.updateBlock({ "block": { "uid": blockData[":block/children"][0][":block/children"][1][":block/uid"], "open": false } });
                    }, 200);
                    document.querySelector("body")?.click();
                }
            }
        };
    },
    onunload: () => {
        for (let index = 0; index < runners['observers'].length; index++) {
            const element = runners['observers'][index];
            element.disconnect()
        };
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("CHESSPUZZLE");
        };
    }
}

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please set your RapidAPI Key in the configuration settings via the Roam Depot tab.");
    }
}