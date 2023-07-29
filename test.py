import execjs

# Script JavaScript que vous souhaitez exécuter
script = """
var x = 5

function add_x(){
    x=x+4
}

function get_x(){
    return x
}
"""

# Créez un contexte d'exécution
context = execjs.compile(script)


# Appelez la fonction JavaScript pour récupérer la valeur de x
x_value = context.call("get_x")
print(x_value)  # Résultat: 5

context.call("add_x")
x_value = context.call("get_x")
print(x_value)  # Résultat: 5