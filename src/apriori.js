var apriori = require("node-apriori");

var transactions = [
    [237, 56, 47, 3],
    [249, 47, 48],
    [253, 47, 47, 3, 3],
    [263, 47, 47, 3],
    [217, 47, 47],
    [234, 47, 47],
    [238, 47, 47],
    [239, 47, 47],
    [194, 47, 43],
    [201, 47, 3],
    [270, 47, 3],
    [200, 47],
    [204, 47],
    [258, 47],
    [262, 47],
    [271, 47],
    [214, 3, 47, 47],
    [232, 3, 47, 47]
];
const getOnly47 = (arr) => arr.filter((num) => num !== 47);

// Aplicar la función a cada subarreglo dentro de transactions
const result = transactions.map(getOnly47);

console.log(result);
var aprioriAlgo = new apriori.Apriori(0.4);
console.log(`Ejecutando Apriori...`);

aprioriAlgo.on('data', function (itemset) {
    var support = itemset.support;
    var items = itemset.items;
    console.log(`Conjunto { ${items.join(', ')} } es frecuente y tiene un apoyo de ${support}`);
});

aprioriAlgo.exec(result)
    .then(function (result) {
        var frequentItemsets = result.itemsets;
        console.log(`Finished executing Apriori. ${frequentItemsets.length} frequent itemsets were found.`);
        var recommendations = generateRecommendations(frequentItemsets);
        console.log("Recomendaciones:");
        recommendations.forEach(function (recommendation, index) {
            console.log(`- ${recommendation}`);
        });
    });

function generateRecommendations(itemsets) {
    itemsets.sort(function (a, b) {
        return b.support - a.support;
    });
    var recommendations = [];
    var recommendationSet = new Set();
    for (var i = 0; i < itemsets.length; i++) {
        var itemset = itemsets[i];
        if (itemset.items.length > 0 && !recommendationSet.has(itemset.items[0])) {
            recommendations.push(itemset.items[0]);
            recommendationSet.add(itemset.items[0]);
        }
    }

    return recommendations;
}
