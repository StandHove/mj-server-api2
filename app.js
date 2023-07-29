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

let update={}

async function fImagine(prompt, id) {
  
  await client.Connect()
  update[id] = {'original':{'uri':"", "progress":0, 'data':'wait for progress to 100%'}}
  const Imagine = await client.Imagine(
    prompt,
    (uri, progress) => {
      console.log("Imagine.loading", uri, "progress", progress);
      update[id]["original"]['uri']=uri
      update[id]["original"]['progress']=progress
    }
  )
  console.log(Imagine)
  update[id]['original']['uri']=Imagine.uri
  update[id]['original']['progress']=Imagine.progress
  update[id]['original']['data'] = Imagine
  console.log("update[id]['original']['data'] = Imagine");
  client.Close()
  return Imagine
}

async function fVariation(ImagineRequest_str, var_id, prompt, id){
    /*
    var_id: "V1", "V2", "V3", "V4"
    ImagineRequest_str = original, variation_V1, upscale_V3
    */
    console.log(update)
    await client.Connect()
    const name = 'variation_'+var_id;
    update[id] = {name:{'uri':"", "progress":0, 'data':'wait for progress to 100%'}}
    console.log(update);
    console.log("const ImagineRequest=update["+id+"]["+ImagineRequest_str+"]['data'];");
    console.log(update[id][ImagineRequest_str]['data']);
    const ImagineRequest=update[id][ImagineRequest_str]['data'];
    console.log("ImagineRequest = ", ImagineRequest)
    const Varition = await client.Custom({
        msgId: toString(ImagineRequest.id),
        flags: ImagineRequest.flags,
        customId: ImagineRequest.options?.find((o) => o.label === var_id)?.custom,
        content: prompt, //remix mode require content
        loading: (uri, progress) => {
          console.log("loading", uri, "progress", progress);
          update[id][name]['uri']=uri
          update[id][name]['progress']=progress
        },
      });
      console.log(Varition);
      update[id][name]['uri']=Varition.uri
      update[id][name]['progress']=Varition.progress
      update[id][name]['data']=Varition
      client.Close()
      return Varition
}

async function fUpscale(ImagineRequest_str, up_id, id){
    /*
    up_id: "U1", "U2", "U3", "U4"
    */
    await client.Connect()
    const name = 'upscale_'+up_id;
    update[id] = {name:{'uri':"", "progress":0, 'data':'wait for progress to 100%'}}
    const ImagineRequest=update[id][ImagineRequest_str]['data'];
    const Upscale = await client.Custom({
        msgId: ImagineRequest.id,
        flags: ImagineRequest.flags,
        customId: ImagineRequest.options?.find((o) => o.label === up_id)?.custom,
        loading: (uri, progress) => {
          console.log("loading", uri, "progress", progress);
          update[id][name]['uri']=uri
          update[id][name]['progress']=progress
        }, 
      });
      console.log(Upscale);
      update[id][name]['uri']=Upscale.uri
      update[id][name]['progress']=Upscale.progress
      update[id][name]['data']=Upscale
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
    update[id]={'original':{'uri':"",'progress':0}}
    fImagine(req.params.prompt, id)
    return res.json({"id":id});
});

app.get('/api/variation/:id/:source_data/:var_id/:prompt', (req,res) => {
    /*
    id = l'identifiant renvoyé par la génération de la première image (exemple: 82c0d97b-c9b2-4d06-a46a-c11660cd09b1)
    source_data = quel json utiliser pour récupérer les informations de l'image à varier (exemple: original; exemple: variation_V1; exemple: upscale_V3)
    var_id = quelle imgage faire varier dans le json (exemple: V1)
    prompt = modification à apporter à l'image (exemple: bateau sur la droite)
    */

    const id = req.params.id
    try{
        if(update[id][req.params.source_data]['progress']=='done'){
            fVariation(update[id][req.params.source_data]["data"], req.params.var_id, req.params.prompt, id)
            res.json({"id":id})
            return id
        }
        else{
            res.json({"error":"progress is not over, please wait"})
            return id
        }
    }
    finally{
        res.json({"error": "update["+id+"]["+req.params.source_data+"]['progress'] dosnt exist or fVariation(update[id][req.params.source_data]['data'], req.params.var_id, req.params.prompt, id)"});
        return id
    }
});

app.get('/api/upscale/:id/:source_data/:up_id', (req,res) => {
    /*
    id = l'identifiant renvoyé par la génération de la première image (exemple: 82c0d97b-c9b2-4d06-a46a-c11660cd09b1)
    source_data = quel json utiliser pour récupérer les informations de l'image à upscale (exemple: original; exemple: variation_V1; exemple: upscale_V3)
    up_id = quelle imgage faire upscale dans le json (exemple: V1)
    */
    const id = req.params.id
    try{
        if(update[id][req.params.source_data]['progress']=='done'){
            fUpscale(update[id][req.params.source_data]["data"], req.params.up_id, id)
            res.json({"id":id})
            return id
        }
        else{
            res.json({"error":"progress is not over, please wait"})
            return id
        }
    }
    finally{
        res.json({"error": "update["+id+"]["+req.params.source_data+"]['progress'] dosnt exist //or// fUpscale(update[id][req.params.source_data]['data'], req.params.up_id, id) dosnt worked"});
        return id
    }
});

app.get('/api/update/:id', (req,res) => {
    const id = req.params.id
    res.json({"id":id, "update":update[id]});
});

