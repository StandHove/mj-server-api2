import execjs

# Script JavaScript que vous souhaitez exécuter
script = """
const { Midjourney } = require("midjourney");
async function main() {
  const client = new Midjourney({
    ServerId: "1082500871478329374",
    ChannelId: "1094892992281718894",
    SalaiToken: "NDI3MDExMDQ3MjEyMzE4NzIw.G9GnL_.kkOyR3ggzboP48GI1l_NvGU-ngxSLscEhWhrac"
  })
  await client.Connect()
  const Imagine = await client.Imagine(
    "Butiful landscape on ocean with an old sailing boat, 1h before sunset, shot by a drone at 100m, realistic, 8k",
    (uri, progress) => {
      console.log("Imagine.loading", uri, "progress", progress)
    }
  )
  console.log(Imagine)
  client.Close()
  return Imagine.content
}
"""

# Créez un contexte d'exécution
context = execjs.compile(script)

# Appelez une fonction du script JavaScript
result = context.call("main")
print(result)  # Résultat: 8