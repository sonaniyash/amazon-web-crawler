import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    marginTop: 10,
    marginBottom: 20,
  },
  media: {
    height: 140,
    backgroundSize: 'contain',
  },
  content: {
    height: 80
  },
  btn: {
    margin: 'auto'
  },
  bestSeller: {
    marginLeft: 16,
    marginTop: 16
  }
});

export default function MediaCard(props: any) {
  const classes = useStyles();

  return (
    <Card className={classes.root} >
      <a href={props.url} target="_blank" style={{ textDecoration: "none" }} >
        <CardActionArea>
          <CardMedia
            className={classes.media}
            image={props.img}
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography
              variant="body2"
              color="textSecondary"
              component="p"
              className={classes.content}
            >
              {props.title}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button
            size="small"
            className={classes.btn}
            variant="outlined"
            href={props.url}
            color="primary"
            target="_blank"
          >
            Check Price
          </Button>
        </CardActions>
      </a>
    </Card>
  );
}