from biom.parse import MetadataMap, parse_biom_table, generatedby

def tojson(input_data):
    table = parse_biom_table(input_data)
    table.type = "Table"
    result = table.to_json(generatedby())
    return result