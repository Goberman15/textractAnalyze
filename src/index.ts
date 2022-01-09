import { TextractClient, AnalyzeExpenseCommand, AnalyzeExpenseCommandInput, AnalyzeExpenseCommandOutput } from '@aws-sdk/client-textract';
import * as fs from 'fs/promises';

interface items {
    [key: string]: number;
}

const analyze = async () => {
    try {
        const client = new TextractClient({});

        const recipe = await fs.readFile('./recipe/test_recipe_1.jpg', 'base64');

        const input: AnalyzeExpenseCommandInput = {
            Document: {
                Bytes: new Uint8Array(Buffer.from(recipe, 'base64'))
            }
        }

        const { ExpenseDocuments } = await client.send(new AnalyzeExpenseCommand(input)) as AnalyzeExpenseCommandOutput;

        if (ExpenseDocuments) {
            const [expense] = ExpenseDocuments;
            const result: items = {}

            const { LineItemGroups, SummaryFields } = expense

            if (LineItemGroups?.length) {

                const [{ LineItems }] = LineItemGroups;

                if (LineItems) {
                    for (const item of LineItems) {
                        const { LineItemExpenseFields } = item

                        if (LineItemExpenseFields) {

                            let itemName: string = '';
                            let price: number = 0;

                            for (let line of LineItemExpenseFields) {

                                if (line.Type?.Text === 'ITEM' && line.ValueDetection?.Text) {
                                    itemName = line.ValueDetection?.Text;
                                }

                                if (line.Type?.Text === 'PRICE' && line.ValueDetection?.Text) {
                                    price = parseInt(line.ValueDetection?.Text.replace(/\.|,/, ''));
                                }
                            }

                            if (itemName && price) {
                                result[itemName] = price;
                            }

                        }
                    }

                }
            }

            if (SummaryFields?.length) {
                let total: number = 0;

                for (const field of SummaryFields) {
                    if (field.Type?.Text === 'TOTAL' && field.ValueDetection?.Text) {
                        total = parseInt(field.ValueDetection?.Text.replace(/\.|,/, ''));
                    }
                }

                result.total = total;
            }

            console.log(result);

            await fs.writeFile('./result/result1.json', JSON.stringify(ExpenseDocuments, null, 2));
        }
    } catch (error) {
        console.error(error);

    }
}

analyze();