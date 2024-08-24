export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.initialBallSpeed = 150;  // Velocidad inicial de la pelota
        this.score = 0;  // Puntaje inicial
        this.isGameOver = false; // Estado del juego
    }

    preload() {
        // Cargar la imagen de fondo
        this.load.image('background', './isla_pirata.png');
    }

    create() {
        let halfwidth = this.game.config.width / 2;
        let halfheight = this.game.config.height / 2;

        // Añadir la imagen de fondo
        this.background = this.add.image(halfwidth, halfheight, 'background');
        
        // Obtener las dimensiones del juego
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;

        // Calcular la escala de la imagen manteniendo la proporción
        const bgWidth = this.background.width;
        const bgHeight = this.background.height;
        const scaleX = gameWidth / bgWidth;
        const scaleY = gameHeight / bgHeight;
        const scale = Math.max(scaleX, scaleY);

        // Aplicar la escala calculada
        this.background.setScale(scale).setScrollFactor(0);

        // Centrar la imagen en la pantalla
        this.background.setPosition(gameWidth / 2, gameHeight / 2);

        // Hacer la imagen de fondo más oscura
        this.background.setAlpha(0.4);  // Ajusta este valor según lo oscuro que quieras el fondo

        // Crear la pala
        this.paddle = this.add.rectangle(400, 550, 50, 200, 0xfff1e8).setDisplaySize(100, 20);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);

        // Crear la pelota
        this.circle = this.add.circle(400, 300, 8, 0xffec27, 1.0).setDisplaySize(20, 20);
        this.physics.add.existing(this.circle);
        this.circle.body.setCollideWorldBounds(true);
        this.circle.body.setBounce(1, 1);
        this.circle.body.setVelocity(this.initialBallSpeed, -this.initialBallSpeed); // Velocidad inicial

        // Ajustar para que la pelota no rebote en el borde inferior
        this.physics.world.setBoundsCollision(true, true, true, false);  // Rebotes solo en los lados y la parte superior

        // Crear una matriz de ladrillos con colores armoniosos
        this.bricks = this.physics.add.staticGroup();
        const brickRows = 5;
        const brickCols = 8;
        const brickWidth = 75;
        const brickHeight = 20;
        const offsetX = 100;
        const offsetY = 50;

        // Colores para los ladrillos
        const colors = [0xff77a8, 0xff9d81, 0xf3ef7d];

        for (let row = 0; row < brickRows; row++) {
            for (let col = 0; col < brickCols; col++) {
                let brickX = offsetX + col * (brickWidth + 10);
                let brickY = offsetY + row * (brickHeight + 10);
                let colorIndex = (row * brickCols + col) % colors.length;
                let brick = this.add.rectangle(brickX, brickY, brickWidth, brickHeight, colors[colorIndex]);
                this.bricks.add(brick);
            }
        }

        // Colisión entre la pelota y los ladrillos
        this.physics.add.collider(this.circle, this.bricks, this.hitBrick, null, this);

        // Colisión entre la pelota y la pala
        this.physics.add.collider(this.circle, this.paddle, this.hitPaddle, null, this);

        // Seguir el puntero del mouse para mover la pala
        this.input.on('pointermove', (pointer) => {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, 750); // Limita el movimiento de la pala
        });

        // Texto para mostrar al perder
        this.gameOverText = this.add.text(halfwidth, halfheight, 'Game Over\nClick to Restart', {
            fontSize: '32px',
            color: '#fff1e8',
            align: 'center'
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);

        // Texto para mostrar el puntaje
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '18px',
            color: '#fff1e8',
            align: 'left'
        });

        // Crear una zona de muerte justo debajo del área visible del juego
        this.deathZone = this.add.zone(400, 610, 800, 10);
        this.physics.world.enable(this.deathZone);
        this.deathZone.body.setAllowGravity(false);
        this.deathZone.body.moves = false;

        // Detectar cuando la pelota cae en la zona de muerte
        this.physics.add.overlap(this.circle, this.deathZone, this.gameOver, null, this);

        // Escuchar clics para reiniciar el juego
        this.input.on('pointerdown', () => {
            if (this.isGameOver) {
                this.scene.restart(); // Reiniciar la escena
            }
        });
    }

    hitPaddle(circle, paddle) {
        let diff = 0;

        if (circle.x < paddle.x) {
            diff = paddle.x - circle.x;
            circle.body.setVelocityX(-10 * diff);
        } else if (circle.x > paddle.x) {
            diff = circle.x - paddle.x;
            circle.body.setVelocityX(10 * diff);
        } else {
            circle.body.setVelocityX(2 + Math.random() * 8);
        }
    }

    hitBrick(circle, brick) {
        brick.destroy();

        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.bricks.countActive() === 0) {
            this.resetGame();
        }
    }

    resetGame() {
        this.initialBallSpeed *= 1.1;
        this.scene.restart();
    }

    gameOver() {
        if (!this.isGameOver) {
            this.circle.body.setVelocity(0, 0);
            this.circle.body.setCollideWorldBounds(false); // Evitar que siga rebotando

            this.gameOverText.setVisible(true);
            this.isGameOver = true;
        }
    }
}
