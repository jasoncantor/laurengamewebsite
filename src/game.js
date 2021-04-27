/// <reference path="../../../Content/GamesDownloadTemplate/lib/ScormHelper.js" />
var Game = Game || (function (createjs, $) {

    function Game(canvas, gameData) {

        var assetsPath = gameData.assetsPath || "";

        var assets = [
            { id: "instructions_background", src: assetsPath + "instructions_background.png" },
            { id: "instructions_question", src: assetsPath + "instructions_question.png" },
            { id: "ttt_marker_x", src: assetsPath + "ttt_marker_x.png" },
            { id: "ttt_marker_o", src: assetsPath + "ttt_marker_o.png" },
            { id: "ttt_game_background", src: assetsPath + "ttt_game_background.png" },
            { id: "ttt_game_side_background", src: assetsPath + "ttt_game_side_background.jpg" },
            { id: "start_button", src: assetsPath + "start_button.png" },
            { id: "title_background", src: assetsPath + "title_background.jpg" },
            { id: "plain_background", src: assetsPath + "plain_background.jpg" },
            { id: "ttt_vs_o", src: assetsPath + "ttt_vs_o.png" },
            { id: "ttt_vs_x", src: assetsPath + "ttt_vs_x.png" },
            { id: "ttt_vs", src: assetsPath + "ttt_vs.png" },
            { id: "ttt_x_wins", src: assetsPath + "ttt_x_wins.png" },
            { id: "ttt_o_wins", src: assetsPath + "ttt_o_wins.png" },
            { id: "ttt_single_player", src: assetsPath + "ttt_single_player.png" },
            { id: "ttt_two_player", src: assetsPath + "ttt_two_player.png" },
            { id: "instructions", src: assetsPath + "ticTacToeInstructions.png" },

            { id: "error", src: assetsPath + "Audio/error.mp3" },
            { id: "gameLost", src: assetsPath + "Audio/gameLost.mp3" },
            { id: "gameWon", src: assetsPath + "Audio/gameWon.mp3" },
            { id: "goodTone", src: assetsPath + "Audio/goodTone.mp3" },
            { id: "oldGuitarIntro", src: assetsPath + "Audio/oldGuitarIntro.mp3" },
            { id: "revealed", src: assetsPath + "Audio/revealed.mp3" },
        ];
        var queue = new createjs.LoadQueue(false);

        queue.installPlugin(createjs.Sound);
        queue.addEventListener("complete", function (event) {
            initializeGame();
        });
        queue.loadManifest(assets);

        var masterSound = createjs.Sound;
        var helpers = {
            soundEffects: function () {
                try {
                    var soundEffectsContainer = new createjs.Container();
                    soundEffectsContainer.x = 50;
                    soundEffectsContainer.y = 00;
                    soundEffectsContainer.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#F00").drawCircle(0, 0, 50));
                    soundEffectsContainer.cursor = 'pointer';

                    var soundEffectsBG = new createjs.Bitmap(resourceLoader.getResult("instructions_background"));
                    soundEffectsBG.x = 0;
                    soundEffectsBG.y = 0;
                    soundEffectsBG.rotation = 90;

                    muteIcon = new createjs.Bitmap(resourceLoader.getResult("musicOn"));
                    muteIcon.x = -50;
                    muteIcon.y = -1;
                    muteIcon.scaleX = 0.8;
                    muteIcon.scaleY = 0.8;
                    muteIcon.rotation = 0;

                    soundEffectsContainer.addChild(soundEffectsBG, muteIcon);

                    soundEffectsContainer.addEventListener("click", function () {
                        try {
                            //console.log("SOUND EFFECTS ENABLED OR DISABLED");
                            var tempMute = masterSound.getMute();
                            if (tempMute) {
                                // unMute
                                muteIcon.image = resourceLoader.getResult("musicOn");
                                masterSound.setMute(false);
                            }
                            else {
                                // reMute
                                muteIcon.image = resourceLoader.getResult("musicOff");
                                masterSound.setMute(true);
                            }
                        }
                        catch (ex) {
                            console.log("ERROR FROM helpers.instructions :: " + ex);
                        }
                    });
                    soundEffectsContainer.on("mouseover", handleInstructionsMouseOver);
                    soundEffectsContainer.on("mouseout", handleInstructionsMouseOver);

                    function handleInstructionsMouseOver(event) {
                        try {
                            if (event.type == "mouseover") {
                                createjs.Tween.get(muteIcon, { loop: false }).to({ scaleX: 1.0, scaleY: 1.0 }, 50);
                            }
                            else {
                                createjs.Tween.get(muteIcon, { loop: false }).to({ scaleX: 0.8, scaleY: 0.8 }, 50);
                            }
                        }
                        catch (ex) {
                            console.log("ERROR FROM handleInstructionsMouseOver() :: " + ex);
                        }
                    }

                    return soundEffectsContainer;
                }
                catch (ex) {
                    console.log("ERROR FROM helpers.soundEffects :: " + ex);
                }
            },
        };

        function htmlElement(html, createJsDomElement, x, y, width, height) {
            this.html = html;
            this.createJsDomElement = createJsDomElement
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.visible = true;
            htmlElements.push(this);
            this.setPosition();
            return this;
        }
        var htmlElements = [];
        htmlElement.prototype.setPosition = function () {
            this.createJsDomElement.x = (this.x + canvas.parentElement.offsetLeft) * canvas.clientWidth / 800
            this.createJsDomElement.y = (this.y ) * canvas.clientHeight / 600
            if (!this.multiLine)
                $("#" + this.html.id).css('font-size', (this.height * canvas.clientWidth / 800) - 2);
            $("#" + this.html.id).height(this.height * canvas.clientWidth / 800 + 2);
            $("#" + this.html.id).width(this.width * canvas.clientHeight / 600);

        }
        $(window).resize(function () {
            for (var j = 0; j < htmlElements.length; j++) {
                htmlElements[j].setPosition();
            }
        });


        gameData = gameData || {};
        submitedScore = false;
        var self = this;

        // Randomize Questions/Answers
        if (gameData.RandomizeQuestions || gameData.RandomizeQuestions === undefined) {
            gameData.Questions = shuffle(gameData.Questions);
        }


        for (var i = 0; i < gameData.Questions.length; i++) {
            if (gameData.Questions[i].RandomizeAnswers) {
                gameData.Questions[i].Answers = shuffle(gameData.Questions[i].Answers);
            }
        }

        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            return array;
        }


        var isLmsConnected = false;
        var currentLmsInteraction = null;

        if (typeof ScormHelper !== 'undefined') {
            isLmsConnected = ScormHelper.initialize();

        }

        function initializeGame() {

            var cellOrigin = [30, 30];
            var cellMargin = [5, 5];
            var cellSize = [150, 150];

            self.gameData = gameData;

            var stage = new createjs.Stage(canvas);
            stage.enableMouseOver(10);

            createjs.Touch.enable(stage, false, true);

            var originalWidth = stage.canvas.width;
            var originalHeight = stage.canvas.height;
            var purple = "#7649AE";

            function getCurrentPlayer() {
                if (playerIndexTurn == 0)
                    return player1;

                return player2;
            }

            function didPlayerWin(player) {

                var winningCombinations = [
                        [0, 1, 2],
                        [3, 4, 5],
                        [6, 7, 8],
                        [0, 3, 6],
                        [1, 4, 7],
                        [2, 5, 8],
                        [0, 4, 8],
                        [2, 4, 6]
                ];

                // no need to check if they havent even placed enough moves.
                if (player.cellIndexes.length < 3) return false;

                for (var i = 0; i < winningCombinations.length; ++i) {
                    var inArray = true;

                    for (var j = 0; j < 3 && inArray; ++j) {
                        if (player.cellIndexes.indexOf(winningCombinations[i][j]) == -1) {
                            inArray = false;
                        }
                    }

                    if (inArray)
                        return winningCombinations[i];
                }
                return false;

            }

            var player1 = {
                name: gameData.UserName || "Player 1",
                cellIndexes: [],
                isComputer: false,
                color: "#008000",
                score: 0,
                index: 0
            };

            var player2 = {
                name: null,
                cellIndexes: [],
                isComputer: false,
                color: "#008080",
                score: 0,
                index: 1
            };

            var isSinglePlayer = true;

            var totalQuestions = gameData.Questions.length;
            var questionIndex = 0;
            var playerIndexTurn = 0;
            var playerCanPlaceMark = false;

            function handleSquareMouseOver(event) {
                var square = event.currentTarget.getChildAt(0);

                if (event.type == "mouseover") {
                    createjs.Tween.get(square, { loop: false }).to({ alpha: 0.5 }, 250);
                }
                else {
                    createjs.Tween.get(square, { loop: false }).to({ alpha: 1.0 }, 250);
                }

                //square.alpha = (event.type == "mouseover") ? 0.5 : 1.0;
            }

            function nextPlayersTurn() {
                playerIndexTurn = (playerIndexTurn * -1) + 1;
            }

            function getCurrentPlayerName() {
                if (playerIndexTurn == 0) {
                    return player1.name;
                }
                return player2.name;
            }



            function handleStartButtonHover(event) {
                if (event.type == "mouseover") {
                    //createjs.Tween.get(event.currentTarget.shadow, { loop: false }).to({ offsetX: 0, offsetY: 0 }, 100);
                    createjs.Tween.get(event.currentTarget).to({ scaleX: 1.0625, scaleY: 1.0625 }, 100).to({ scaleX: 1.0, scaleY: 1.0 }, 100).to({ scaleX: 1.0625, scaleY: 1.0625 }, 200);
                }
                else {
                    //createjs.Tween.get(event.currentTarget.shadow, { loop: false }).to({ offsetX: 3, offsetY: 3 }, 75);
                    createjs.Tween.get(event.currentTarget).to({ scaleX: 1.0, scaleY: 1.0 }, 100);
                }
            }

            function createTitleView() {
                var view = new createjs.Container();

                var titleText = new createjs.Text(gameData.Title, "36px Arial Black", "#7649AE");
                titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                titleText.lineWidth = 780;
                titleText.x = 10;
                titleText.y = 10;

                var descriptionText = new createjs.Text(gameData.Description, "20px Bold Arial", "dark gray");
                descriptionText.lineWidth = 780;
                descriptionText.x = 10;
                descriptionText.y = 100;

                var startButton = new createjs.Bitmap(queue.getResult("start_button"));
                startButton.shadow = new createjs.Shadow("gray", 3, 3, 3);
                startButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawCircle(50, 50, 50));
                startButton.cursor = 'pointer';
                startButton.regX = 50;
                startButton.regY = 50;
                startButton.x = 725;
                startButton.y = 525;

                view.addChild(new createjs.Bitmap(queue.getResult("title_background")))
                view.addChild(startButton);
                view.addChild(descriptionText);
                view.addChild(titleText);

                startButton.addEventListener("click", function (event) {
                    showView(createNumberOfPlayersView());
                });

                startButton.on("mouseover", handleStartButtonHover);
                startButton.on("mouseout", handleStartButtonHover);

                return view;
            }

            function createNumberOfPlayersView() {
                var view = new createjs.Container();

                var titleText = new createjs.Text("How many players???", "36px Arial Black", "#7649AE");
                titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                titleText.textAlign = "center";
                titleText.x = 400;
                titleText.y = 75;


                var oneContainer = new createjs.Container();
                var twoContainer = new createjs.Container();

                oneContainer.addChild(new createjs.Bitmap(queue.getResult("ttt_single_player")));
                twoContainer.addChild(new createjs.Bitmap(queue.getResult("ttt_two_player")));

                oneContainer.hitArea = twoContainer.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawRect(0, 0, 150, 150));
                oneContainer.cursor = twoContainer.cursor = 'pointer';

                oneContainer.shadow = new createjs.Shadow("gray", 3, 3, 10);
                twoContainer.shadow = new createjs.Shadow("gray", 3, 3, 10);

                oneContainer.regX = twoContainer.regX = 75;
                oneContainer.regY = twoContainer.regY = 75;

                var oneText = new createjs.Text("", "72px Arial Black");
                var twoText = new createjs.Text("", "72px Arial Black");
                oneText.textAlign = twoText.textAlign = "center";
                oneText.textBaseline = twoText.textBaseline = "middle";
                oneText.x = twoText.x = 75;
                oneText.y = twoText.y = 75;

                oneContainer.addChild(oneText);
                twoContainer.addChild(twoText);

                oneContainer.y = twoContainer.y = 275;
                oneContainer.x = 275;
                twoContainer.x = 525;

                view.addChild(new createjs.Bitmap(queue.getResult("plain_background")))
                view.addChild(titleText);
                view.addChild(oneContainer);
                view.addChild(twoContainer);

                oneContainer.on("mouseover", function () {
                    createjs.Tween.get(oneContainer).to({ scaleX: 1.125, scaleY: 1.125 }, 100).to({ scaleX: 1.0625, scaleY: 1.0625 }, 100).to({ scaleX: 1.125, scaleY: 1.125 }, 100);
                    createjs.Tween.get(twoContainer).to({ scaleX: 0.875, scaleY: 0.875 }, 100);
                });

                oneContainer.on("mouseout", function () {
                    createjs.Tween.get(oneContainer).to({ scaleX: 1, scaleY: 1 }, 75);
                    createjs.Tween.get(twoContainer).to({ scaleX: 1, scaleY: 1 }, 75);
                });

                twoContainer.on("mouseover", function () {
                    createjs.Tween.get(twoContainer).to({ scaleX: 1.125, scaleY: 1.125 }, 100).to({ scaleX: 1.0625, scaleY: 1.0625 }, 100).to({ scaleX: 1.125, scaleY: 1.125 }, 100);
                    createjs.Tween.get(oneContainer).to({ scaleX: 0.875, scaleY: 0.875 }, 100);
                });

                twoContainer.on("mouseout", function () {
                    createjs.Tween.get(twoContainer).to({ scaleX: 1, scaleY: 1 }, 75);
                    createjs.Tween.get(oneContainer).to({ scaleX: 1, scaleY: 1 }, 75);
                });


                oneContainer.addEventListener("click", function (event) {
                    player2.isComputer = true;
                    player2.name = "Player 2";
                    isSinglePlayer = true;
                    showView(createSinglePlayerEnterNameView());
                });

                twoContainer.addEventListener("click", function (event) {
                    player2.isComputer = false;
                    player2.name = null;
                    isSinglePlayer = false;
                    showView(createTwoPlayerEnterNamesView());
                });

                return view;
            }
            //window.onresize = function () {
            //    var x = document.getElementsByName("player1Input");
            //    var y = document.getElementsByName("player2Input");
            //    if (x.length > 0) {
            //        x[0].style.left = canvas.offsetLeft + "px";
            //        x[0].style.top = canvas.offsetTop+ "px";
            //    }
            //    if (y.length > 0) {
            //        y[0].style.left = canvas.offsetLeft + "px";
            //        y[0].style.top = canvas.offsetTop + "px";
            //    }
            //}
            function createSinglePlayerEnterNameView(isTwoPlayer) {
                var view = new createjs.Container();

                var titleText = new createjs.Text(isTwoPlayer ? "Enter Player Names" : "What is your name?", "30px Arial Black", purple);
                titleText.x = 40;
                titleText.y = 40;
                titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);

                var xImage = new createjs.Bitmap(queue.getResult("ttt_marker_x"));
                xImage.scaleX = 1 / 3; // make the image 50x50
                xImage.scaleY = 1 / 3;
                xImage.x = 40;
                xImage.y = 130;
                xImage.shadow = new createjs.Shadow("gray", 3, 3, 3);

                var player1NameInput = document.createElement("input");
                player1NameInput.value = player1.name;
                player1NameInput.name = "player1Input";
                player1NameInput.id = "player1Input";
                player1NameInput.type = "text";
                player1NameInput.style.width = "350px";
                player1NameInput.style.font = "24pt Arial";
                player1NameInput.style.left = canvas.offsetLeft + "px";
                player1NameInput.style.top = canvas.offsetTop  + "px";

                stage.canvas.parentElement.insertBefore(player1NameInput, stage.canvas)

                var player1NameInputControl = new createjs.DOMElement(player1NameInput);
                player1NameInputControl.x = 110;
                player1NameInputControl.y = 130;
               
                var a = new htmlElement(player1NameInput,player1NameInputControl, 110,130,350,35)

                if (isTwoPlayer) {
                    var oImage = new createjs.Bitmap(queue.getResult("ttt_marker_o"));
                    oImage.scaleX = 1 / 3; // make the image 50x50
                    oImage.scaleY = 1 / 3;
                    oImage.x = 40;
                    oImage.y = 210;
                    oImage.shadow = new createjs.Shadow("gray", 3, 3, 3);

                    var player2NameInput = document.createElement("input");
                    player2NameInput.value = player2.name;
                    player2NameInput.name = "player2Input";
                    player2NameInput.id = "player2Input";
                    player2NameInput.type = "text";
                    player2NameInput.style.width = "350px";
                    player2NameInput.style.font = "24pt Arial";
                    player2NameInput.style.left = canvas.offsetLeft + "px";
                    player2NameInput.style.top = canvas.offsetTop + "px";

                    stage.canvas.parentElement.insertBefore(player2NameInput, stage.canvas)

                    var player2NameInputControl = new createjs.DOMElement(player2NameInput);
                    player2NameInputControl.x = 110;
                    player2NameInputControl.y = 210;                    
                    var a = new htmlElement(player2NameInput, player2NameInputControl, 110, 210, 350, 35)

                }


                var backButton = new createjs.Bitmap(queue.getResult("start_button"));
                backButton.shadow = new createjs.Shadow("gray", 3, 3, 3);
                backButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawCircle(50, 50, 50));
                backButton.cursor = 'pointer';
                backButton.scaleX = -0.375;
                backButton.scaleY = 0.375;
                backButton.regX = 50;
                backButton.regY = 50;
                backButton.x = 625;
                backButton.y = 557;

                var startButton = new createjs.Bitmap(queue.getResult("start_button"));
                startButton.shadow = new createjs.Shadow("gray", 3, 3, 3);
                startButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawCircle(50, 50, 50));
                startButton.cursor = 'pointer';
                startButton.regX = 50;
                startButton.regY = 50;
                startButton.x = 725;
                startButton.y = 525;

                startButton.on("mouseover", function (event) {
                    createjs.Tween.get(event.currentTarget).to({ scaleX: 1.0625, scaleY: 1.0625 }, 100).to({ scaleX: 1.0, scaleY: 1.0 }, 100).to({ scaleX: 1.0625, scaleY: 1.0625 }, 200);
                });

                startButton.on("mouseout", function (event) {
                    createjs.Tween.get(event.currentTarget).to({ scaleX: 1.0, scaleY: 1.0 }, 100);
                });

                view.addChild(new createjs.Bitmap(queue.getResult("title_background")));
                view.addChild(titleText);
                view.addChild(xImage);
                view.addChild(startButton, backButton);
                view.addChild(player1NameInputControl);
                if (isTwoPlayer) {
                    view.addChild(oImage, player2NameInputControl);
                }

                startButton.addEventListener("click", function (event) {

                    //TODO: Make sure we got a name, if not, show a validation message
                    if ((isSinglePlayer && player1NameInput.value == "") || (isSinglePlayer == false && player2NameInput.value == "")) {
                        var errorText = new createjs.Text("Please enter a name.", "18px Arial Black", "red");
                        errorText.x = 110;
                        errorText.y = 100;
                        view.addChild(errorText);
                    } else {

                        player1.name = player1NameInput.value;
                        player1NameInput.parentNode.removeChild(player1NameInput);

                        if (isTwoPlayer) {
                            player2.name = player2NameInput.value;
                            player2NameInput.parentNode.removeChild(player2NameInput);
                        }
                        showView(createMatchupView());
                    }



                });

                backButton.addEventListener("click", function (event) {

                    player1NameInput.parentNode.removeChild(player1NameInput);

                    if (isTwoPlayer) {
                        player2NameInput.parentNode.removeChild(player2NameInput);
                    }

                    showView(self.previousView);
                });

                return view;
            }

            var availableGameCells = [];

            function createTwoPlayerEnterNamesView() {
                return createSinglePlayerEnterNameView(true);
            }

            function createMatchupView() {
                var view = new createjs.Container();

                var titleText = new createjs.Text("PREPARE FOR BATTLE!", "48px Arial Black", "#7649AE");
                titleText.textAlign = "center";
                titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                titleText.lineWidth = 400;
                titleText.x = 400;
                titleText.y = 25;

                var xbattleImage = new createjs.Bitmap(queue.getResult("ttt_vs_x"));
                var obattleImage = new createjs.Bitmap(queue.getResult("ttt_vs_o"));

                xbattleImage.regX = obattleImage.regX = 105;
                xbattleImage.regY = obattleImage.regY = 50;

                createjs.Tween.get(xbattleImage, { loop: true })
                              .to({ scaleX: 1.0625 }, 300)
                              .to({ scaleX: 1.0 }, 300)
                              .to({}, 500)

                createjs.Tween.get(xbattleImage, { loop: true })
                              .to({}, 500)
                              .to({ scaleY: 1.0625 }, 300)
                              .to({ scaleY: 1.0 }, 300)
                              .to({}, 750)

                createjs.Tween.get(obattleImage, { loop: true })
                              .to({}, 200)
                              .to({ scaleX: 1.0625 }, 300)
                              .to({ scaleX: 1.0 }, 300)
                              .to({}, 600)

                createjs.Tween.get(obattleImage, { loop: true })
                              .to({}, 300)
                              .to({ scaleY: 1.0625 }, 300)
                              .to({ scaleY: 1.0 }, 300)
                              .to({}, 700)

                xbattleImage.shadow = obattleImage.shadow = new createjs.Shadow("gray", 5, 5, 10);



                xbattleImage.x = 210 + xbattleImage.regX;
                xbattleImage.y = 180 + xbattleImage.regY;

                obattleImage.x = 430 + obattleImage.regX;
                obattleImage.y = xbattleImage.y;

                var player1Text = new createjs.Text(player1.name, "36px Arial Bold");
                player1Text.textAlign = "right";
                player1Text.x = 350;
                player1Text.y = 375;


                var player2Text = new createjs.Text(player2.name, "36px Arial Bold");
                player2Text.x = 450;
                player2Text.y = player1Text.y

                player1Text.shadow = player2Text.shadow = titleText.shadow;

                var startButton = new createjs.Bitmap(queue.getResult("start_button"));
                startButton.shadow = new createjs.Shadow("gray", 3, 3, 3);
                startButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawCircle(50, 50, 50));
                startButton.cursor = 'pointer';
                startButton.regX = 50;
                startButton.regY = 50;
                startButton.x = 400;
                startButton.y = 500;
                startButton.scaleX = startButton.scaleY = 1.25;
                createjs.Tween.get(startButton, { loop: true })
                              .to({ scaleX: 1.50, scaleY: 1.50 }, 1000)
                              .to({ scaleX: 1.25, scaleY: 1.25 }, 750)

                var backButton = new createjs.Bitmap(queue.getResult("start_button"));
                backButton.shadow = new createjs.Shadow("gray", 3, 3, 3);
                backButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawCircle(50, 50, 50));
                backButton.cursor = 'pointer';
                backButton.scaleX = -0.375;
                backButton.scaleY = 0.375;
                backButton.regX = 50;
                backButton.regY = 50;
                backButton.x = 275;
                backButton.y = 553;

                createjs.Tween.get(backButton, { loop: true })
                              .to({ scaleX: -0.375, scaleY: 0.375 }, 1000)
                              .to({ scaleX: -0.475, scaleY: 0.475 }, 700)
                              .to({ scaleX: -0.375, scaleY: 0.375 }, 800)

                var vsImage = new createjs.Bitmap(queue.getResult("ttt_vs"));
                vsImage.regX = 50;
                vsImage.regY = 50;
                vsImage.x = 400;
                vsImage.y = 375;
                vsImage.scaleX = 1.25;
                vsImage.scaleY = 1.25;

                var vsText = new createjs.Text("vs");

                vsText.x = 400;
                vsText.y = 375;

                view.addChild(new createjs.Bitmap(queue.getResult("plain_background")));
                view.addChild(xbattleImage, obattleImage);
                view.addChild(titleText);
                view.addChild(player1Text);
                view.addChild(player2Text);
                view.addChild(vsImage);
                view.addChild(startButton, backButton);

                startButton.addEventListener("click", function () {
                    showView(createMainGameView());
                });

                backButton.addEventListener("click", function () {
                    if (player2.isComputer) {
                        showView(createSinglePlayerEnterNameView());
                    }
                    else {
                        showView(createTwoPlayerEnterNamesView());
                    }
                });

                return view;
            }

            function createMainGameView() {
                var mainView = new createjs.Container();
                createjs.Sound.play("oldGuitarIntro", { loop: 0, volume: 0.08 });
                mainView.name = "mainView";
                var background = new createjs.Bitmap(queue.getResult("ttt_game_background"));
                var sideBackground = new createjs.Bitmap(queue.getResult("ttt_game_side_background"));

                sideBackground.x = 533;

                mainView.addChild(background);
                mainView.addChild(sideBackground);


                var lineColor = createjs.Graphics.getRGB(0xFFFFFF * Math.random(), 1);

                for (var i = 0; i < 9; ++i) {
                    var cell = new createjs.Container();
                    cell.cursor = 'pointer';
                    cell.occupied = false;
                    cell.logicalIndex = i;
                    cell.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawRect(0, 0, cellSize[0], cellSize[1]));


                    var square = new createjs.Shape();

                    var x = cellOrigin[0] + ((cellSize[0] + cellMargin[0]) * (i % 3)),
                        y = cellOrigin[1] + ((cellSize[1] + cellMargin[1]) * Math.floor(i / 3));

                    cell.x = x;
                    cell.y = y;

                    square.graphics.beginFill("#F0F0F0").drawRect(0, 0, cellSize[0], cellSize[0]);

                    cell.on("mouseover", handleSquareMouseOver);
                    cell.on("mouseout", handleSquareMouseOver);
                    cell.on("click", handleSquareClick);

                    cell.addChild(square);
                    cell.name = "cell" + i;
                    mainView.addChild(cell);
                    availableGameCells.push(cell);
                }

                function computerPlaceMarker() {
                    var randomIndex = Math.floor(Math.random() * availableGameCells.length);

                    placeMarkerInCell(availableGameCells[randomIndex]);
                }

                function handleSquareClick(event) {
                    if (playerCanPlaceMark) {
                        var cell = event.currentTarget;

                        if (!cell.occupied) {
                            placeMarkerInCell(cell);
                        }
                    }
                }

                function placeMarkerInCell(cell) {
                    if (!cell.occupied) {

                        var bounds = cell.getBounds();

                        var bitmap;

                        if (playerIndexTurn == 0) {
                            // X
                            bitmap = new createjs.Bitmap(queue.getResult("ttt_marker_x"));
                        }
                        else {
                            // O
                            bitmap = new createjs.Bitmap(queue.getResult("ttt_marker_o"));
                        }

                        cell.addChild(bitmap);

                        //bitmap.alpha = 0;



                        cell.occupied = true;
                        playerCanPlaceMark = false;
                        getCurrentPlayer().cellIndexes.push(cell.logicalIndex);

                        var inArrayIndex = availableGameCells.indexOf(cell);
                        if (inArrayIndex > -1) {
                            availableGameCells.splice(inArrayIndex, 1);
                        }

                        createjs.Tween.get(bitmap, { loop: false }).to({ alpha: 1 }, 1000).call(showNextQuestion);
                        //showNextQuestion();
                    } else {
                        computerPlaceMarker();
                    }
                }

                var currentArea = getDisplayQuestionArea();

                function handleAnswerMouseOver(event) {

                    var background = event.currentTarget.getChildAt(0);

                    if (event.type == "mouseover") {
                        createjs.Tween.get(background.shadow, { loop: false }).to({ offsetX: 0, offsetY: 0 }, 100);
                    }
                    else {
                        createjs.Tween.get(background.shadow, { loop: false }).to({ offsetX: 3, offsetY: 3 }, 75);
                    }

                }

                function handleAnswerClick(event) {
                    mainView.removeChild(currentArea);

                    if (currentLmsInteraction != null) {
                        currentLmsInteraction.result = event.currentTarget.isCorrect ? ScormHelper.results.correct : ScormHelper.results.incorrect;
                        currentLmsInteraction.learnerResponse = event.currentTarget.answer.Text;
                        currentLmsInteraction.save();
                        currentLmsInteraction = null;
                    }


                    if (event.currentTarget.isCorrect) {
                        getCurrentPlayer().score += 100;
                        currentArea = getCorrectAnswerArea();
                    }
                    else {
                        currentArea = getIncorrectAnswerArea();
                    }

                    mainView.addChild(currentArea);

                    stage.update();
                }

                function getDisplayQuestionArea() {
                    var container = new createjs.Container();

                    container.x = 540;
                    container.y = cellOrigin[1];

                    var currentPlayer = getCurrentPlayer();

                    var questionAreaTitleText = new createjs.Text(currentPlayer.name + "'s turn", "24px Arial Black", currentPlayer.color);
                    var questionText = new createjs.Text(gameData.Questions[questionIndex].Text, "bold 20px Arial", "dark gray");
                    questionText.y = 33;
                    questionText.lineWidth = 250;

                    container.addChild(questionAreaTitleText);
                    container.addChild(questionText);

                    if (isLmsConnected) {
                        var question = gameData.Questions[questionIndex];

                        currentLmsInteraction = ScormHelper.cmi.interactions().new();

                        currentLmsInteraction.id = question.Id;
                        currentLmsInteraction.description = question.Text;
                        currentLmsInteraction.type = ScormHelper.interactions.choice;
                    }

                    for (var i = 0; i < gameData.Questions[questionIndex].Answers.length; ++i) {
                        var answerBox = new createjs.Container();

                        var answerBackground = new createjs.Shape();

                        answerBackground.graphics.beginFill("white").beginStroke("#000").setStrokeStyle(1).drawRoundRect(0, 0, 250, 70, 5).endFill().endStroke();
                        answerBackground.shadow = new createjs.Shadow("gray", 3, 3, 10);

                        var answer = gameData.Questions[questionIndex].Answers[i];

                        var answerText = new createjs.Text(answer.Text, "bold 16px Arial", "gray");
                        answerText.lineWidth = 225;
                        answerText.x = 5;
                        answerText.y = 5;

                        answerBox.cursor = 'pointer';
                        answerBox.isCorrect = answer.IsCorrect;
                        answerBox.answer = answer;

                        answerBox.y = 150 + (i * 80);

                        answerBox.addEventListener("click", handleAnswerClick);
                        answerBox.on("mouseover", handleAnswerMouseOver);
                        answerBox.on("mouseout", handleAnswerMouseOver);


                        answerBox.addChild(answerBackground);
                        answerBox.addChild(answerText);
                        container.addChild(answerBox);
                    }

                    return container;
                }
                $(window).bind('beforeunload', function () {
                    if (player1.score + player2.score > 0)
                    {
                        if (player1.score > player2.score)
                            submitScore(player1.score)
                        else
                            submitScore(player2.score)
                    }
                })

                function submitScore(score) {
                    if (submitedScore)
                        return false;
                    submitedScore  = true;
                    var url = gameData.leaderboardUrl;

                    if (url) {

                        var data = {
                            gameId: gameData.id,
                            score: score
                        };

                        $.ajax(url, {
                            type: "POST",
                            data: data,
                            success: function (x) {

                            },
                            error: function (x, y, z) {


                            }
                        });

                    }
                }

                function showNextQuestion() {
                    submitedScore = false;
                    mainView.removeChild(currentArea);
                    currentArea = null;

                    var currentPlayer = getCurrentPlayer();

                    var winningCombination = didPlayerWin(currentPlayer);

                    if (winningCombination) {
                        // draw the line
                        var line = new createjs.Shape();

                        var startX = (cellSize[0] / 2) + cellOrigin[0] + (winningCombination[0] % 3) * (cellSize[0] + cellMargin[0]),
                            startY = (cellSize[1] / 2) + cellOrigin[1] + (Math.floor(winningCombination[0] / 3)) * (cellSize[1] + cellMargin[1]),
                            endX = (cellSize[0] / 2) + cellOrigin[0] + (winningCombination[2] % 3) * (cellSize[0] + cellMargin[0]),
                            endY = (cellSize[1] / 2) + cellOrigin[1] + (Math.floor(winningCombination[2] / 3)) * (cellSize[1] + cellMargin[1]);

                        line.alpha = 0;
                        line.graphics.setStrokeStyle(30, "round").beginStroke("dark gray").moveTo(startX, startY).lineTo(endX, endY).endStroke();


                        createjs.Tween.get(line).to({ alpha: 1.0 }, 1000);

                        if (currentPlayer.isComputer) {
                            mainView.addChild(getLoserArea(currentPlayer));
                        }
                        else {
                            mainView.addChild(getWinnerArea(currentPlayer));
                        }

                        submitScore(currentPlayer.score);
                        mainView.addChild(line);
                    }
                    else {

                        if (availableGameCells.length == 0) {
                            mainView.addChild(getDrawGameArea());
                        }
                        else {

                            if (!currentPlayer.isComputer) {
                                ++questionIndex;
                            }

                            if (questionIndex < gameData.Questions.length) {
                                nextPlayersTurn();

                                if (getCurrentPlayer().isComputer) {
                                    computerPlaceMarker();
                                }
                                else {
                                    currentArea = getDisplayQuestionArea();
                                    mainView.addChild(currentArea);
                                }
                            }
                            else {
                                submitScore(currentPlayer.score);
                                mainView.addChild(getDrawGameArea());
                            }
                        }
                    }

                    stage.update();
                }

                function getWinnerArea(player) {

                    var container = new createjs.Container();

                    container.x = 540;
                    container.y = cellOrigin[1];

                    var title;

                    if (player) {

                        title = player.name + " won!";

                        var image = new createjs.Bitmap(queue.getResult(player.index % 2 == 0 ? "ttt_x_wins" : "ttt_o_wins"));
                        image.regX = 175;
                        image.regY = 150;

                        // this image has a width of 350 for some reason...
                        image.scaleX = 260 / 350.0;
                        image.scaleY = 260 / 350.0;

                        image.x = 130;
                        image.y = 120;

                        container.addChild(image);
                    }
                    else {
                        if (questionIndex == gameData.Questions.length && availableGameCells.length != 0) {
                            title = "Out\nof\nquestions.\nDraw!"
                        } else {
                            title = "It's\nA\nDraw!";
                        }
                    }

                    var titleText = new createjs.Text(title, "30pt Arial Black", "red");
                    titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                    titleText.x = 130;
                    titleText.y = ((200 - titleText.getBounds().height) / 2);
                    titleText.lineWidth = 250;
                    titleText.textAlign = "center";
                    titleText.textBaseline = "middle";

                    var startOverButton = new createjs.Container();
                    startOverButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawRect(0, 0, 200, 35));
                    startOverButton.x = 130;
                    startOverButton.y = 250;
                    startOverButton.regX = 100;
                    startOverButton.regY = 35;
                    startOverButton.cursor = 'pointer';
                    startOverButton.addChild(new createjs.Shape(new createjs.Graphics().setStrokeStyle(1).beginStroke("dark gray").beginFill("#35B000").drawRoundRect(0, 0, 200, 35, 5).endFill()));
                    startOverButton.shadow = new createjs.Shadow("gray", 3, 3, 5);

                    var startOverText = new createjs.Text("Start Over", "20pt Arial", "white");
                    startOverText.textAlign = "center";
                    startOverText.textBaseline = "middle";
                    startOverText.x = 100;
                    startOverText.y = 17.5;
                    startOverText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                    if (!isLmsConnected) {
                        startOverButton.addChild(startOverText)
                    }
                    var rematchButton = new createjs.Container();
                    rematchButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawRect(0, 0, 200, 35));
                    rematchButton.x = 130;
                    rematchButton.y = 300;
                    rematchButton.regX = 100;
                    rematchButton.regY = 35;
                    rematchButton.cursor = 'pointer';
                    rematchButton.addChild(new createjs.Shape(new createjs.Graphics().setStrokeStyle(1).beginStroke("dark gray").beginFill("#35B000").drawRoundRect(0, 0, 200, 35, 5).endFill()));
                    rematchButton.shadow = new createjs.Shadow("gray", 3, 3, 5);

                    var rematchText = new createjs.Text("Rematch", "20pt Arial", "white");
                    rematchText.textAlign = "center";
                    rematchText.textBaseline = "middle";
                    rematchText.x = 100;
                    rematchText.y = 17.5;
                    rematchText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                    if (!isLmsConnected) {
                        rematchButton.addChild(rematchText)
                    }
                    var quitButton = new createjs.Container();
                    quitButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawRect(0, 0, 200, 35));
                    quitButton.x = 130;
                    quitButton.y = 350;
                    quitButton.regX = 100;
                    quitButton.regY = 35;
                    quitButton.cursor = 'pointer';
                    quitButton.addChild(new createjs.Shape(new createjs.Graphics().setStrokeStyle(1).beginStroke("dark gray").beginFill("#35B000").drawRoundRect(0, 0, 200, 35, 5).endFill()));
                    quitButton.shadow = new createjs.Shadow("gray", 3, 3, 5);


                    var quitText = new createjs.Text("Quit", "20pt Arial", "white");
                    quitText.textAlign = "center";
                    quitText.textBaseline = "middle";
                    quitText.x = 100;
                    quitText.y = 17.5;
                    quitText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                    quitButton.addChild(quitText)


                    var mouseOverCallback = function (event) {
                        var target = event.currentTarget;
                        createjs.Tween.get(target).to({ scaleX: 1.0625, scaleY: 1.0625 }, 100);
                    };

                    var mouseOutCallback = function (event) {
                        var target = event.currentTarget;
                        createjs.Tween.get(target).to({ scaleX: 1.0, scaleY: 1.0 }, 200);

                        target.getChildAt(0).graphics.clear().setStrokeStyle(1).beginStroke("dark gray").beginFill("#35B000").drawRoundRect(0, 0, 200, 35, 5).endFill();
                    };

                    var mouseDownCallback = function (event) {
                        var target = event.currentTarget.getChildAt(0);

                        target.graphics.clear().setStrokeStyle(1).beginStroke("dark gray").beginFill("#369713").drawRoundRect(0, 0, 200, 35, 5).endFill();
                    };

                    if (!isLmsConnected) {
                        startOverButton.on("mouseover", mouseOverCallback);
                        startOverButton.on("mouseout", mouseOutCallback);
                        startOverButton.on("mousedown", mouseDownCallback)
                        startOverButton.addEventListener("click", startOver);

                        rematchButton.on("mouseover", mouseOverCallback);
                        rematchButton.on("mouseout", mouseOutCallback);
                        rematchButton.on("mousedown", mouseDownCallback)
                        rematchButton.addEventListener("click", rematch);
                    }
                    quitButton.on("mouseover", mouseOverCallback);
                    quitButton.on("mouseout", mouseOutCallback);
                    quitButton.on("mousedown", mouseDownCallback)
                    quitButton.addEventListener("click", quit);


                    if (isLmsConnected || navigator.userAgent.match(/Android/i)
                    || navigator.userAgent.match(/webOS/i)
                    || navigator.userAgent.match(/iPhone/i)
                    || navigator.userAgent.match(/iPad/i)
                    || navigator.userAgent.match(/iPod/i)
                    || navigator.userAgent.match(/BlackBerry/i)
                    || navigator.userAgent.match(/Windows Phone/i)
                    ) {
                        container.addChild(quitButton)
                    }
                    if (!isLmsConnected) {
                        container.addChild(startOverButton, rematchButton);
                    }
                    if (isLmsConnected) {
                        ScormHelper.cmi.successStatus(ScormHelper.successStatus.passed);
                        ScormHelper.cmi.completionStatus(ScormHelper.completionStatus.completed);

                        isLmsConnected = false;
                    }

                    container.addChild(titleText);

                    return container;
                }

                function getLoserArea(player) {
                    return getWinnerArea(player);
                }

                function getDrawGameArea() {

                    return getWinnerArea();
                }

                function getIncorrectAnswerArea() {

                    var container = new createjs.Container();
                    container.x = 540;
                    container.y = cellOrigin[1];

                    var titleText = new createjs.Text("Incorrect ", "30pt Arial Black", "red");
                    titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                    titleText.x = 10;
                    if (!self.gameData.Questions[questionIndex].Feedback) {
                        for (var i = 0; i < self.gameData.Questions[questionIndex].Answers.length; i++) {
                            if (self.gameData.Questions[questionIndex].Answers[i].IsCorrect) {

                                var feedbackTextAlt = self.gameData.Questions[questionIndex].Answers[i].Text;
                            }
                        }
                    }
                    var feedbackText = new createjs.Text(self.gameData.Questions[questionIndex].Feedback || feedbackTextAlt, "20pt Arial", "dark gray");
                    feedbackText.lineWidth = 240;
                    feedbackText.x = 10;
                    feedbackText.y = 65;

                    var startButton = new createjs.Bitmap(queue.getResult("start_button"));
                    startButton.shadow = new createjs.Shadow("gray", 3, 3, 3);
                    startButton.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#f00").drawCircle(50, 50, 50));
                    startButton.cursor = 'pointer';
                    startButton.regX = 50;
                    startButton.regY = 50;
                    startButton.x = 130;
                    startButton.y = 350;

                    container.addChild(titleText, feedbackText, startButton);

                    startButton.alpha = 0;
                    createjs.Tween.get(startButton).to({}, 500).to({ alpha: 1 }, 500).call(function () {
                        createjs.Tween.get(startButton, { loop: true })
                                  .to({ scaleX: 1.125, scaleY: 1.125 }, 1000)
                                  .to({ scaleX: 1.0, scaleY: 1.0 }, 750);
                    });

                    startButton.addEventListener("click", showNextQuestion); startButton.on("mouseover", function (event) {
                        createjs.Tween.get(event.currentTarget).to({ scaleX: 1.0625, scaleY: 1.0625 }, 100).to({ scaleX: 1.0, scaleY: 1.0 }, 100).to({ scaleX: 1.0625, scaleY: 1.0625 }, 200);
                    });

                    startButton.on("mouseout", function (event) {
                        createjs.Tween.get(event.currentTarget).to({ scaleX: 1.0, scaleY: 1.0 }, 100);
                    });

                    return container;
                }


                function getCorrectAnswerArea() {
                    var container = new createjs.Container();
                    container.x = 540;
                    container.y = cellOrigin[1];
                    playerCanPlaceMark = true;

                    var titleText = new createjs.Text("Correct", "30pt Arial Black", "red");
                    titleText.shadow = new createjs.Shadow("gray", 1, 1, 3);
                    titleText.x = 10;
                    if (!self.gameData.Questions[questionIndex].Feedback) {
                        for (var i = 0; i < self.gameData.Questions[questionIndex].Answers.length; i++) {
                            if (self.gameData.Questions[questionIndex].Answers[i].IsCorrect) {

                                var feedbackTextAlt = self.gameData.Questions[questionIndex].Answers[i].Text;
                            }
                        }
                    }
                    var feedbackText = new createjs.Text(self.gameData.Questions[questionIndex].Feedback || feedbackTextAlt, "20pt Arial", "dark gray");
                    feedbackText.lineWidth = 240;
                    feedbackText.x = 10;
                    feedbackText.y = 65;

                    var markerImage = new createjs.Bitmap(queue.getResult(playerIndexTurn % 2 == 0 ? "ttt_marker_x" : "ttt_marker_o"));
                    markerImage.scaleX = 1 / 3;
                    markerImage.scaleY = 1 / 3;
                    markerImage.x = 20;
                    markerImage.y = 250;
                    markerImage.shadow = new createjs.Shadow("gray", 3, 3, 3);

                    var placeYourMarkText = new createjs.Text("Place your mark", "20pt Arial", getCurrentPlayer().color);
                    placeYourMarkText.lineWidth = 150;
                    placeYourMarkText.x = 85;
                    placeYourMarkText.y = 245;
                    placeYourMarkText.shadow = new createjs.Shadow("gray", 1, 1, 3);

                    container.addChild(titleText, feedbackText, markerImage, placeYourMarkText);

                    return container;
                }

                mainView.addChild(currentArea);

                return mainView;
            }

            function rematch() {
                gameData.Questions = shuffle(gameData.Questions);
                availableGameCells = [];
                questionIndex = 0;
                playerIndexTurn = 0;
                playerCanPlaceMark = false;
                player1.cellIndexes = [];
                player1.score = 0;
                player1.index = 0;
                player2.cellIndexes = [];
                player2.score = 0;
                player2.index = 1;
                showView(createMatchupView());
                //randomize array of questions
            }

            function startOver() {
                gameData.Questions = shuffle(gameData.Questions);
                availableGameCells = [];
                questionIndex = 0;
                playerIndexTurn = 0;
                playerCanPlaceMark = false;
                player1.name = gameData.UserName || "Player 1";
                player1.cellIndexes = [];
                player1.isComputer = false;
                player1.score = 0;
                player1.index = 0;
                player2.name = null;
                player2.cellIndexes = [];
                player2.isComputer = false;
                player2.score = 0;
                player2.index = 1;
                showView(createTitleView());
            }

            var quit;

            if (isLmsConnected) {
                quit = function () {
                    ScormHelper.cmi.exit("");
                    ScormHelper.adl.nav.request("exitAll");
                    ScormHelper.terminate();
                }
            }
            else {
                quit = function () {
                    window.location = "http://www.wisc-online.com";
                }
            }


            function createInstructionsView() {
                var view = new createjs.Container();
                var image = new createjs.Bitmap(queue.getResult("instructions"));

                var hit = new createjs.Shape();
                var exitContainer = new createjs.Container();
                var exitBox = new createjs.Shape();

                exitContainer.x = 720;
                exitContainer.y = 570;
                var exitText = new createjs.Text("BACK", 'bold 18px Arial', "#fff");
                exitText.x = 8;
                exitText.y = 8;
                exitContainer.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#7449AE").beginStroke("#000").setStrokeStyle(1).drawRoundRect(0, 0, 70, 37, 5).endFill().endStroke());
                hit.graphics.beginFill("#000").drawRect(0, 0, exitText.getMeasuredWidth(), exitText.getMeasuredHeight());
                exitBox.graphics.beginFill("#7449AE").beginStroke("#000").setStrokeStyle(1).drawRoundRect(0, 0, 70, 37, 5).endFill().endStroke();
                exitText.hitArea = hit;
                exitContainer.addChild(exitBox, exitText);
                var background = new createjs.Shape(new createjs.Graphics().beginFill("#fff").beginStroke("#fff").setStrokeStyle(1).drawRect(0, 00, 800, 600).endFill().endStroke());

                view.addChild(background, image, exitContainer);

                exitContainer.addEventListener("click", function (event) {
                    showView(self.previousView);
                });

                return view;
            }

            function createDrawView() {

            }

            var instructionsView = null;

            function getInstructionsView() {
                if (instructionsView == null) {
                    instructionsView = createInstructionsView();
                }

                return instructionsView;
            }


            self.previousView = null;
            self.currentView = null;
            function showView(view) {

                // TODO: add transition animation (fade)

                if (self.currentView) {
                    stage.removeChild(self.currentView);
                    self.previousView = self.currentView;
                }
                else {
                    self.previousView = null;
                }

                if (view) {
                    stage.addChild(view);
                    self.currentView = view;
                }
                else {
                    self.currentView = null;
                }


                if (self.currentView == instructionsView) {
                    stage.removeChild(instructionsContainer);
                }
                else {
                    stage.addChild(instructionsContainer);
                }

                stage.update();
            };

            var instructionsContainer = new createjs.Container();
            instructionsContainer.x = 0;
            instructionsContainer.y = 550;
            instructionsContainer.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#F00").drawCircle(0, 50, 50));
            instructionsContainer.cursor = 'pointer';

            instructionsContainer.addChild(new createjs.Bitmap(queue.getResult("instructions_background")));

            var questionMark = new createjs.Bitmap(queue.getResult("instructions_question"));
            //questionMark.regX = 25;
            //questionMark.regY = 25;

            instructionsContainer.addChild(questionMark);

            stage.addChild(instructionsContainer);

            instructionsContainer.addEventListener("click", function () {
                showView(getInstructionsView());
            });

            function handleInstructionsMouseOver(event) {
                if (event.type == "mouseover") {
                    createjs.Tween.get(questionMark, { loop: false }).to({ scaleX: 1.0625, scaleY: 1.0625 }, 50);
                }
                else {
                    createjs.Tween.get(questionMark, { loop: false }).to({ scaleX: 1.0, scaleY: 1.0 }, 50);
                }
            }

            instructionsContainer.on("mouseover", handleInstructionsMouseOver);
            instructionsContainer.on("mouseout", handleInstructionsMouseOver);

            showView(createTitleView());
            createjs.Ticker.addEventListener("tick", stage);
        };
    }

    return Game;
})(createjs, $);