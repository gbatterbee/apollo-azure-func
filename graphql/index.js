const server = require("apollo-server-azure-functions");
const graphqlTools = require("graphql-tools");

const typeDefs = `
type Task {
  id: ID!
  itemTypes: [ItemType]
}

type ItemType {
  itemTypeId:String
  baseType:String
  value:ValueType!
}

type ValueType {
  value:String!
#    nameTypes:[NameType!]
}

type NameType {
  nameTypeId:String
  rules:[Rule]!
  value:[NameTypeValue]
}

type NameTypeValue{
  unit:String!
  headings:[String!]
  nutrients:[Nutrient!]
  lookupId:Int!
  text:String!
  errors:[Error!]
}


type Rule{
  constraInts:[Int]
}

type Error{
  raisedBy:User
  raisedOn:String
  message:String
  resolvedBy:User!
  resolutionComment:String!
  resolvedOn:String!
  resolutionType:String!
}

type User{
  id:String
  name:String
}

type Nutrient{
  description:[String]
  values:[Float]
}

type Query {
  task: Task
}

input ItemTypeM {
  itemTypeId:String
  baseType:String
  value:ValueTypeM
}

input ValueTypeM {
  value:[String!]
  nameTypes:[NameTypeM!]
}

input NameTypeM {
  nameTypeId:String
  value:[NameTypeValueM]
}

input NameTypeValueM{
  unit:String!
  headings:[String!]
  nutrients:[NutrientM!]
  lookupId:Int!
  text:String!
}

input NutrientM{
  description:[String]
  values:[Float]
}

type Mutation {
  submitData(data: [ItemTypeM]):String
}
`;

const tasks =
    [
        {
            id: 1,
            itemTypes: [{ id: 'otherInformation', variantId: 'uk', order: 1 }]
        }
    ]
const taskApi = id => Promise.resolve(tasks);

const itemTypes = {
    otherInformation: {
        description: "Other Information",
        baseType: "ItemMemo",
    }
};
const itemTypeApi = (idsAndVariants) => Promise.resolve(itemTypes);

const productVersionData = {
    otherInformation: {
        value: "it's a little fish that can be found in Hawaii",
    },
}
const productVersionsApi = id => Promise.resolve(productVersionData);;

var resolvers = {
    Query: {
        task: async (id) => {
            var tasks = await taskApi(id);
            var itemTypes = await itemTypeApi(id);
            var productVersionData = await productVersionsApi(id);

            const task = tasks[0];
            task.itemTypes =
                Object.keys(itemTypes)
                    .map(itemTypeId =>
                        Object.assign({},
                            itemTypeConfiguration(itemTypes, itemTypeId),
                            itemTypeIdentifier(itemTypeId),
                            itemValue(productVersionData, itemTypeId)
                        ));
            return task;
        },
    },
    Mutation: {
        submitData: async (data) => {
            productVersionData.otherInformation.value = "oop";
            return "hi";
        }
    }
};

const itemTypeConfiguration = (itemTypes, itemTypeId) => itemTypes[itemTypeId];
const itemTypeIdentifier = (itemTypeId) => { return { itemTypeId } };
const itemValue = (value,itemTypeId) => { return { value: { value: productVersionData[itemTypeId].value } } };


const schema = graphqlTools.makeExecutableSchema({
    typeDefs,
    resolvers
});

console.log('writeline stuff')


module.exports = function (context, req) {

    const endpointURL = req.url;
    if (req.method === "POST") {
        server.graphqlAzureFunctions({ schema, endpointURL, })(context, req);
    } else if (req.method === "GET") {
        return server.graphiqlAzureFunctions({ endpointURL, })(context, req);
    }
};