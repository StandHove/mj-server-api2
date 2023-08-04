import express from 'express';
import https from 'https';
import fs from 'fs';
import { Midjourney } from 'midjourney';
import { v4 as uuidv4 } from 'uuid';


const client = new Midjourney({
    ServerId: "1082500871478329374",
    ChannelId: "1094892992281718894",
    SalaiToken: "NDI3MDExMDQ3MjEyMzE4NzIw.GTgMW0.PlCnjRz6QI9QmJ7n2d5TOVLu08M8b7ZSdh-1ZQ",
    Debug: true,
    Ws: true    
  })


var data = {"00000000-0000-0000-0000-000000000000":{"progress":["",0], "obj":[]}}

async function fImagine(id: number, prompt: string) {

    await client.Connect()
    const Imagine = await client.Imagine(
    prompt,
    (uri, progress) => {
        console.log("Imagine.loading", uri, "progress", progress);
        data[id]["progress"] = [uri, progress]
    }
    )
    data[id]["progress"] = [Imagine.uri, Imagine.progress]
    data[id]['obj'].push(Imagine)
    console.log("||||||||||||||||||||||||||||||||||||||||||||||");
    console.log("|||||||||||||||||| Variation |||||||||||||||||");
    console.log("||||||||||||||||||||||||||||||||||||||||||||||");
    console.log(Imagine)
    client.Close()
    return Imagine
}

async function fVariation(id, data_obj_i, var_id){
    /*
    var_id: "1", "2", "3", "4"
    data_obj_i = numéro de la liste à prendre, exeple: 0, 2, 1
    */
    //if(typeof(prompt)==='undefined'){prompt = "";}

    await client.Connect()
    const ImagineRequest=data[id]['obj'][data_obj_i];
    const Varition = await client.Variation({
        index: var_id,
        msgId: <string>ImagineRequest.id,
        hash: <string>ImagineRequest.hash,
        flags: ImagineRequest.flags,
        content: ImagineRequest.content,
        loading: (uri, progress) => {
            console.log("Variation.loading", uri, "progress", progress);
            data[id]['progress'] = [uri, progress];
        },
    });
    console.log("||||||||||||||||||||||||||||||||||||||||||||||");
    console.log("|||||||||||||||||| Variation |||||||||||||||||");
    console.log("||||||||||||||||||||||||||||||||||||||||||||||");
    console.log(Varition)
    data[id]['progress']=[Varition.uri,Varition.progress];
    data[id]['obj'].push(Varition);
    client.Close()
    return Varition
}

async function fUpscale(id, data_obj_i, up_id){
    /*
    up_id: "U1", "U2", "U3", "U4"
    data_obj_i = numéro de la liste à prendre, exeple: 0, 2, 1
    */
    await client.Connect()
    const ImagineRequest=data[id]['obj'][data_obj_i];
    const Upscale = await client.Upscale({
        index: up_id,
        msgId: <string>ImagineRequest.id,
        hash: <string>ImagineRequest.hash,
        flags: ImagineRequest.flags,
        loading: (uri, progress) => {
            console.log("Upscale.loading", uri, "progress", progress);
            data[id]['progress'] = [uri, progress];
        }, 
      });
    console.log("||||||||||||||||||||||||||||||||||||||||||||||");
    console.log("|||||||||||||||||| Upscale  |||||||||||||||||");
    console.log("||||||||||||||||||||||||||||||||||||||||||||||");
    console.log(Upscale)
    data[id]['progress']=[Upscale.uri,Upscale.progress];
    data[id]['obj'].push(Upscale);
    client.Close()
    return Upscale
}

//const prompt = "Butiful landscape on ocean with few old sailing boat who have reds sailings, 1h before sunrise, with few littles clouds, shot flush with the water, realistic, 8k";
const app = express();
const port = 3000;
// Charger les fichiers du certificat SSL
const privateKey = fs.readFileSync('/home/theo82_morales/certs/34.155.55.120/key.pem', 'utf8');
const certificate = fs.readFileSync('/home/theo82_morales/certs/34.155.55.120/cert.pem', 'utf8');
//const privateKey = fs.readFileSync('key.pem', 'utf8');
//const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur Express de vision-all.com pour midjourney sécurisé en HTTPS !');
  });

app.get('/api/imagine/:prompt', (req, res) => {
    const id = uuidv4();
    data[id] = {"progress":["","waiting to start"], "obj":[]}

    fImagine(id, req.params.prompt)
    return res.json({"status": "api working for your request, please use http://34.155.55.120:3000/api/update/"+id, "id":id})
});

app.get('/api/variation/:id/:data_obj_i/:var_id', (req,res) => {
    /*
    id = l'identifiant renvoyé par la génération de la première image (exemple: 82c0d97b-c9b2-4d06-a46a-c11660cd09b1)
    data_obj_i = quel json utiliser pour récupérer les informations de l'image à varier (exemple: 0; exemple: 1; exemple: 2)
    var_id = quelle imgage faire varier dans le json (exemple: V1)
    prompt = modification à apporter à l'image (exemple: bateau sur la droite)
    */
    
    const id = req.params.id;
    data[id]['progress'] = ["","waiting to start"];
    if(data[id]['obj'][req.params.data_obj_i].progress==='done'){
        fVariation(id, req.params.data_obj_i, req.params.var_id)
        //return res.redirect("http://localhost:"+port+"/api/update/"+id)
        return res.json({"status": "api working for your request, please use http://34.155.55.120:3000/api/update/"+id, "id":id})
    }
    else{
        res.status(500);
        return res.json({"status":"Please wait for progress = done", "actual progress": data[id]['progress'][1]})
    }
});

app.get('/api/upscale/:id/:data_obj_i/:up_id', (req,res) => {
    /*
    id = l'identifiant renvoyé par la génération de la première image (exemple: 82c0d97b-c9b2-4d06-a46a-c11660cd09b1)
    data_obj_i = quel json utiliser pour récupérer les informations de l'image à varier (exemple: 0; exemple: 1; exemple: 2)
    up_id = quelle imgage faire upscale dans le json (exemple: V1)
    */
    const id = req.params.id;
    data[id]['progress'] = ["","waiting to start"];
    if(data[id]['obj'][req.params.data_obj_i].progress==='done'){
        fUpscale(id, req.params.data_obj_i, req.params.up_id)
        return res.json({"status": "api working for your request, please use http://34.155.55.120:3000/api/update/"+id, "id":id})
    }
    else{
        res.status(500);
        return res.json({"status":"Please wait for progress = done", "actual progress": data[id]['progress'][1]})
    }
});

app.get('/api/update/:id', (req,res) => {
    const id = req.params.id
    return res.json({"id":id, "uri":data[id]['progress'][0], "progress":data[id]['progress'][1]});
});

app.get('/api/admin/allupdate/:pswd', (req,res) => {
    if(req.params.pswd == "Odg82000!"){
        return res.json(data);
    }
    else{
        return res.json({"status" : "error, you entered the wrong password"})
    }
});

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
    console.log(`Serveur Express en HTTPS écoutant sur le port ${port}`);
  });