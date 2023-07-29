const express = require('express');
const { Midjourney } = require("midjourney");
const { v4: uuidv4 } = require('uuid');

const client = new Midjourney({
    ServerId: "1082500871478329374",
    ChannelId: "1094892992281718894",
    SalaiToken: "NDI3MDExMDQ3MjEyMzE4NzIw.G9GnL_.kkOyR3ggzboP48GI1l_NvGU-ngxSLscEhWhrac",
    Debug: true,
    Ws: true    
  })


var data = {0:{"progress":["",0], "obj":[]}}

async function fImagine(id, prompt) {

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
        index: Number(var_id),
        msgId: toString(ImagineRequest.id),
        hash: toString(ImagineRequest.hash),
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
    const Upscale = await client.Custom({
        msgId: ImagineRequest.id,
        flags: ImagineRequest.flags,
        customId: ImagineRequest.options?.find((o) => o.label === up_id)?.custom,
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

app.use(express.json());


app.listen(port, () => {
  console.log(`Le serveur est en cours d'exécution sur http://localhost:${port}`);
});

app.get('/api/imagine/:prompt', (req, res) => {
    const id = uuidv4();
    data[id] = {"progress":["","waiting to start"], "obj":[]}

    fImagine(id, req.params.prompt)
    return res.redirect("http://localhost:"+port+"/api/update/"+id)
    //return res.json({"id":id});
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
        return res.redirect("http://localhost:"+port+"/api/update/"+id)
        //res.json({"status": "api working for your request, please use api/update/id", "id":id})
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
        return res.redirect("http://localhost:"+port+"/api/update/"+id)
        //res.json({"status": "api working for your request, please use api/update/id to see progress", "id":id})
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

app.get('/api/allupdate', (req,res) => {
    return res.json(data);
});