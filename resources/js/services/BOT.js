export function botChooseCharacter(photos) {
    const n = Math.floor(Math.random() * (photos.length));
    return photos[n];
}

export async function botChooseIfGuess(photos, difficulty) {
    let candidates = photos.filter(el => el?.state == false);
    if((difficulty == 0 && candidates.length <= 4) || candidates.length <= 2) {
        return true;
    }
    return false
}

export async function botGuess(photos, difficulty) {
    let candidates = photos.filter(el => el?.state == false);
    let n = 0;
    console.log(candidates);
    if(candidates.length != 0) {
        n = Math.floor(Math.random() * (candidates.length));
        console.log(n);
        return candidates[n];
    } else {
        n = Math.floor(Math.random() * (photos.length));
        return photos[n];
    }
}

export async function botQuestionResponse(photo, question) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return photo?.questions.find(el => el.id == question.id)?.response;
}

export async function botAskQuestion(photos, difficulty, questions) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    if(difficulty == 0) {
        const n = Math.floor(Math.random() * (questions.length));
        return questions[n];
    } else if(difficulty == 1) {
        let map = questions.map(el => {
            return {
                id: el?.id,
                count: 0
            }
        });
        let photoArray = photos.filter(el => !el.state);
        photoArray.forEach(el => {
            el?.questions.forEach(q => {
                if(q?.response) {
                    const item = map.find(m => m.id === q.id);
                    if (item) {
                        item.count++;
                    }
                }
            });
        });
        let averageItem = map.reduce((average, item) => {
            if(item.count != photoArray.length && Math.abs(item.count - (photoArray.length / 2)) < Math.abs(average.count - (photoArray.length / 2))) {
                return item;
            }
            return average;
        }, map[0]);
        return questions.find(el => (el.id == averageItem.id));
    } else {
        let map = questions.map(el => {
            return {
                id: el?.id,
                count: 0
            }
        });
        let photoArray = photos.filter(el => !el.state);
        photoArray.forEach(el => {
            el?.questions.forEach(q => {
                if(q?.response) {
                    const item = map.find(m => m.id === q.id);
                    if (item) {
                        item.count++;
                    }
                }
            });
        });
        let maxItem = map.reduce((max, item) => {
            if(item.count != photoArray.length && item.count > max.count) {
                return item;
            }
            return max;
        }, map[0]);
        return questions.find(el => (el.id == maxItem.id));
    }
}

export async function botRegisterResponse(photos, question, response) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return photos.map(el => {
        if(el?.questions.find(el2 => el2.id == question.id)?.response != response) {
            el.state = true;
        }
        return el;
    })
}
