const URL = "./my_model/"; // Caminho da pasta do seu modelo exportado
let model, webcam, ctx, labelContainer, maxPredictions;

document.getElementById("confirmar").addEventListener("click", () => {
    const resposta = document.getElementById("resposta").value.trim().toLowerCase();
    if (resposta === "sim") {
        document.getElementById("pergunta").style.display = "none";
        document.getElementById("resposta").style.display = "none";
        document.getElementById("confirmar").style.display = "none";
        document.getElementById("camera").style.display = "block";
        init();
    } else {
        alert("Responda 'sim' para iniciar.");
    }
});

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";

    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let sinal2Detectado = false;

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
        labelContainer.childNodes[i].innerHTML = classPrediction;

        if (prediction[i].className === "sinal2" && prediction[i].probability > 0.8) {
            sinal2Detectado = true;
        }
    }

    const mensagem = document.getElementById("mensagem");
    if (sinal2Detectado) {
        mensagem.innerText = "MUITO BOM";
        mensagem.style.color = "green";
    } else {
        mensagem.innerText = "NÃO É VC";
        mensagem.style.color = "red";
    }

    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
